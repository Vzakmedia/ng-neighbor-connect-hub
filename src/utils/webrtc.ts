import { supabase } from '@/integrations/supabase/client';

export class WebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private conversationId: string;
  private currentUserId: string;
  private otherUserId: string = '';
  private isInitiator: boolean = false;
  private callStartTime: Date | null = null;
  private callConnectedTime: Date | null = null;
  private currentCallLogId: string | null = null;
  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private hasRemoteDescription: boolean = false;
  private isEnding: boolean = false;
  private iceRestartAttempts: number = 0;
  private maxIceRestarts: number = 3;
  private iceRestartDelay: number = 2000;
  private currentFacingMode: 'user' | 'environment' = 'user';
  private statsLogInterval: NodeJS.Timeout | null = null;

  constructor(
    conversationId: string,
    currentUserId: string,
    private onRemoteStream: (stream: MediaStream) => void,
    private onCallEnd: (reason?: 'ended' | 'declined' | 'failed' | 'disconnected') => void,
    private onOfferSent?: () => void,
    private onAnswerReceived?: () => void
  ) {
    this.conversationId = conversationId;
    this.currentUserId = currentUserId;
    this.initializeOtherUserId();
    this.setupPeerConnection();
  }

  private async initializeOtherUserId() {
    this.otherUserId = await this.getOtherUserId();
  }

  private async setupPeerConnection() {
    // Fetch TURN credentials from edge function
    let iceServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ];

    try {
      const { data: credentials, error } = await supabase.functions.invoke('get-turn-credentials');
      if (!error && credentials?.iceServers) {
        iceServers = credentials.iceServers;
        console.log('[WebRTC] Loaded TURN credentials from server');
      } else {
        console.warn('[WebRTC] Failed to load TURN credentials, using STUN only');
      }
    } catch (error) {
      console.warn('[WebRTC] Error fetching TURN credentials:', error);
    }

    this.pc = new RTCPeerConnection({ iceServers });

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    this.pc.ontrack = (event) => {
      console.log('[WebRTC] ontrack fired:', {
        kind: event.track.kind,
        trackId: event.track.id,
        streams: event.streams.length,
        enabled: event.track.enabled,
        readyState: event.track.readyState
      });
      
      // Use the first stream or create one if needed
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else {
        // If no stream provided, add track to existing or new stream
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        this.remoteStream.addTrack(event.track);
      }
      
      console.log('[WebRTC] Remote stream tracks:', this.remoteStream.getTracks().map(t => 
        `${t.kind}: enabled=${t.enabled}, readyState=${t.readyState}`
      ));
      
      this.onRemoteStream(this.remoteStream);
    };

    this.pc.onnegotiationneeded = async () => {
      console.log('[WebRTC] Negotiation needed');
    };

    this.pc.onconnectionstatechange = async () => {
      console.log('[WebRTC] Connection state:', this.pc?.connectionState);
      
      if (this.pc?.connectionState === 'connected') {
        console.log('WebRTC connection established successfully');
        this.updateCallLog('connected');
        this.callConnectedTime = new Date();
        this.iceRestartAttempts = 0; // Reset on successful connection
        this.startStatsLogging();
      }
      
      if (this.pc?.connectionState === 'failed' && !this.isEnding) {
        if (this.iceRestartAttempts < this.maxIceRestarts) {
          this.iceRestartAttempts++;
          const delay = this.iceRestartDelay * Math.pow(2, this.iceRestartAttempts - 1);
          console.log(`Connection failed, attempting ICE restart ${this.iceRestartAttempts}/${this.maxIceRestarts} in ${delay}ms`);
          
          setTimeout(async () => {
            try {
              const offer = await this.pc!.createOffer({ iceRestart: true });
              await this.pc!.setLocalDescription(offer);
              await this.sendSignalingMessage({
                type: 'offer',
                offer: offer,
                isRestart: true
              });
            } catch (error) {
              console.error('ICE restart failed:', error);
            }
          }, delay);
        } else {
          console.log('Max ICE restart attempts reached, ending call');
          this.onCallEnd('failed');
        }
      }
      
      if (this.pc?.connectionState === 'disconnected' && !this.isEnding) {
        console.log('Connection disconnected');
        this.onCallEnd('disconnected');
      }
      
      if (this.pc?.connectionState === 'closed' && !this.isEnding) {
        this.onCallEnd('ended');
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.pc?.iceConnectionState);
    };
  }

  async startCall(video: boolean = false) {
    try {
      console.log('Starting call - video:', video);
      this.isInitiator = true;
      
      // Create call log entry
      await this.createCallLog(video ? 'video' : 'voice');
      
      // Get user media with more robust error handling
      try {
        console.log('Requesting media access - video:', video, 'audio: true');
        const constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000
          },
          video: video ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: this.currentFacingMode
          } : false
        };
        
        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Got local media stream:', this.localStream.getTracks().map(t => `${t.kind}: ${t.label}`));
      } catch (mediaError: any) {
        console.error('Error getting user media:', mediaError);
        
        if (mediaError.name === 'NotAllowedError') {
          throw new Error('Camera or microphone access denied. Please enable permissions in your device settings and try again.');
        } else if (mediaError.name === 'NotFoundError') {
          const device = video ? 'camera or microphone' : 'microphone';
          throw new Error(`No ${device} found on this device. Please connect a ${device} and try again.`);
        } else if (mediaError.name === 'NotReadableError') {
          throw new Error('Your camera or microphone is already in use by another application. Please close other apps and try again.');
        } else if (mediaError.name === 'OverconstrainedError') {
          throw new Error('Your device does not meet the video call requirements. Try using voice call instead.');
        } else {
          throw new Error(`Unable to access your device: ${mediaError.message}`);
        }
      }

      this.callStartTime = new Date();

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        console.log(`[CALLER] Adding ${track.kind} track - enabled: ${track.enabled}, muted: ${track.muted}, label: ${track.label}`);
        this.pc?.addTrack(track, this.localStream!);
      });

      // Verify transceivers are set to sendrecv
      this.verifyTransceivers();

      // Create offer
      const offer = await this.pc!.createOffer();
      await this.pc!.setLocalDescription(offer);
      console.log('Created offer');

      // Send push notification for incoming call
      await this.sendCallNotification(video);

      // Send offer through signaling with retry mechanism
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await this.sendSignalingMessage({
            type: 'offer',
            offer: offer,
            callType: video ? 'video' : 'audio'
          });
          console.log('Offer sent successfully');
          
          // Notify that offer was sent successfully
          this.onOfferSent?.();
          break;
        } catch (signalError) {
          retryCount++;
          console.warn(`Signaling attempt ${retryCount} failed:`, signalError);
          if (retryCount >= maxRetries) {
            throw new Error('Failed to send call invitation after multiple attempts');
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      console.log('Call initiated successfully');
      return this.localStream;
    } catch (error) {
      console.error('Error starting call:', error);
      // Update call log as failed
      if (this.currentCallLogId) {
        await this.updateCallLog('failed');
      }
      // Clean up local stream if created
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }
      throw error;
    }
  }

  async answerCall(offer: RTCSessionDescriptionInit, video: boolean = false) {
    try {
      this.callStartTime = new Date();
      
      // Get user media with error handling
      console.log('Answering call with video:', video);
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        },
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: this.currentFacingMode
        } : false
      };
      
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Got local media stream for answer:', this.localStream.getTracks().map(t => `${t.kind}: ${t.label}`));
      } catch (mediaError: any) {
        console.error('Error getting user media while answering:', mediaError);
        
        if (mediaError.name === 'NotAllowedError') {
          throw new Error('Camera or microphone access denied. Please enable permissions and try again.');
        } else if (mediaError.name === 'NotFoundError') {
          const device = video ? 'camera or microphone' : 'microphone';
          throw new Error(`No ${device} found on this device.`);
        } else if (mediaError.name === 'NotReadableError') {
          throw new Error('Your camera or microphone is already in use by another application.');
        } else {
          throw new Error(`Unable to access your device: ${mediaError.message}`);
        }
      }

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        console.log(`[RECEIVER] Adding ${track.kind} track - enabled: ${track.enabled}, muted: ${track.muted}, label: ${track.label}`);
        this.pc?.addTrack(track, this.localStream!);
      });

      // Verify transceivers are set to sendrecv
      this.verifyTransceivers();

      // Set remote description (offer)
      await this.pc!.setRemoteDescription(offer);
      this.hasRemoteDescription = true;
      
      // Process any pending ICE candidates
      await this.processPendingIceCandidates();

      // Create answer
      const answer = await this.pc!.createAnswer();
      await this.pc!.setLocalDescription(answer);

      // Send answer through signaling
      await this.sendSignalingMessage({
        type: 'answer',
        answer: answer
      });

      console.log('Call answered');
      return this.localStream;
    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  }

  async handleSignalingMessage(message: any) {
    try {
      console.log('Handling signaling message:', message.type);
      switch (message.type) {
        case 'offer':
          // Only process ICE restart offers - initial offers go through answerCall()
          if (message.isRestart && this.pc!.remoteDescription) {
            console.log('Received ICE restart offer, processing...');
            await this.pc!.setRemoteDescription(message.offer);
            const answer = await this.pc!.createAnswer();
            await this.pc!.setLocalDescription(answer);
            await this.sendSignalingMessage({ type: 'answer', answer });
          } else {
            console.log('Ignoring initial offer - should be handled by answerCall()');
          }
          break;
          
        case 'answer':
          console.log('Processing call answer');
          // Handle call answer
          await this.pc!.setRemoteDescription(message.answer);
          this.hasRemoteDescription = true;
          await this.processPendingIceCandidates();
          
          // Notify that answer was received
          this.onAnswerReceived?.();
          break;
          
        case 'ice-candidate':
          console.log('Processing ICE candidate');
          // Handle ICE candidate
          if (this.hasRemoteDescription && this.pc!.remoteDescription) {
            try {
              await this.pc!.addIceCandidate(message.candidate);
              console.log('ICE candidate added successfully');
            } catch (error) {
              console.error('Error adding ICE candidate:', error);
            }
          } else {
            console.log('Queuing ICE candidate - no remote description yet');
            this.pendingIceCandidates.push(message.candidate);
          }
          break;
          
        case 'call-end':
          console.log('Processing call end signal');
          this.cleanupCall();
          break;
          
        case 'call-decline':
          console.log('Call was declined');
          this.onCallEnd('declined');
          this.cleanupCall();
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
      // Don't throw - this could break the call flow
    }
  }

  private async processPendingIceCandidates() {
    if (this.pendingIceCandidates.length > 0 && this.hasRemoteDescription) {
      console.log(`Processing ${this.pendingIceCandidates.length} pending ICE candidates`);
      for (const candidate of this.pendingIceCandidates) {
        try {
          await this.pc!.addIceCandidate(candidate);
        } catch (error) {
          console.error('Error adding pending ICE candidate:', error);
        }
      }
      this.pendingIceCandidates = [];
    }
  }

  private async sendSignalingMessage(message: any) {
    try {
      await (supabase as any)
        .from('call_signaling')
        .insert({
          conversation_id: this.conversationId,
          sender_id: this.currentUserId,
          receiver_id: this.otherUserId, // Target specific recipient
          message: message,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error sending signaling message:', error);
    }
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  async switchCamera() {
    if (!this.localStream) {
      console.error('No local stream available');
      return;
    }

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) {
      console.error('No video track available');
      return;
    }

    try {
      // Toggle facing mode
      this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
      
      // Get new stream with opposite facing mode
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: this.currentFacingMode
        }
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      
      // Find the sender that is sending the old video track
      const sender = this.pc?.getSenders().find(s => s.track?.kind === 'video');
      
      if (sender) {
        // Replace the track in the peer connection
        await sender.replaceTrack(newVideoTrack);
        
        // Stop the old track
        videoTrack.stop();
        
        // Update the local stream
        this.localStream.removeTrack(videoTrack);
        this.localStream.addTrack(newVideoTrack);
        
        console.log(`Switched camera to ${this.currentFacingMode} facing mode`);
      }
    } catch (error) {
      console.error('Error switching camera:', error);
      // Revert facing mode on error
      this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
      throw error;
    }
  }

  endCall() {
    if (this.isEnding) return; // Prevent duplicate calls
    this.isEnding = true;

    console.log('Ending call');

    // Calculate duration and update call log
    if (this.callStartTime && this.currentCallLogId) {
      const duration = Math.floor((new Date().getTime() - this.callStartTime.getTime()) / 1000);
      this.updateCallLog('ended', duration);
    }

    // Send end call signal
    this.sendSignalingMessage({ type: 'call-end' });

    // Clean up resources
    this.cleanupResources();

    this.onCallEnd();
  }

  private cleanupCall() {
    if (this.isEnding) return; // Prevent duplicate calls
    this.isEnding = true;

    console.log('Cleaning up call (no signal sent)');

    // Calculate duration and update call log
    if (this.callStartTime && this.currentCallLogId) {
      const duration = Math.floor((new Date().getTime() - this.callStartTime.getTime()) / 1000);
      this.updateCallLog('ended', duration);
    }

    // Clean up resources WITHOUT sending call-end signal
    this.cleanupResources();

    this.onCallEnd();
  }

  private cleanupResources() {
    // Stop stats logging
    this.stopStatsLogging();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    // Reset call state
    this.callStartTime = null;
    this.currentCallLogId = null;
  }

  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream() {
    return this.remoteStream;
  }

  private async createCallLog(callType: 'voice' | 'video'): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('call_logs')
        .insert({
          conversation_id: this.conversationId,
          caller_id: this.currentUserId,
          receiver_id: await this.getOtherUserId(),
          call_type: callType,
          call_status: 'failed' // Will be updated when call connects
        })
        .select('id')
        .single();

      if (error) throw error;
      this.currentCallLogId = data.id;
    } catch (error) {
      console.error('Error creating call log:', error);
    }
  }

  private async updateCallLog(status: string, duration?: number): Promise<void> {
    if (!this.currentCallLogId) return;

    try {
      const updateData: any = {
        call_status: status,
        updated_at: new Date().toISOString()
      };

      if (status === 'ended') {
        updateData.end_time = new Date().toISOString();
        if (duration !== undefined) {
          updateData.duration_seconds = duration;
        } else if (this.callConnectedTime) {
          // Calculate duration from when call was actually connected
          const durationMs = new Date().getTime() - this.callConnectedTime.getTime();
          updateData.duration_seconds = Math.floor(durationMs / 1000);
        }
      }

      const { error } = await supabase
        .from('call_logs')
        .update(updateData)
        .eq('id', this.currentCallLogId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating call log:', error);
    }
  }

  private async getOtherUserId(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('direct_conversations')
        .select('user1_id, user2_id')
        .eq('id', this.conversationId)
        .single();

      if (error) throw error;
      
      return data.user1_id === this.currentUserId ? data.user2_id : data.user1_id;
    } catch (error) {
      console.error('Error getting other user ID:', error);
      return '';
    }
  }

  private async sendCallNotification(isVideoCall: boolean): Promise<void> {
    try {
      const otherUserId = await this.getOtherUserId();
      
      const { data: callerProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', this.currentUserId)
        .single();

      await supabase.functions.invoke('send-call-notification', {
        body: {
          recipientId: otherUserId,
          callerId: this.currentUserId,
          callerName: callerProfile?.display_name || 'Someone',
          callType: isVideoCall ? 'video' : 'audio',
          conversationId: this.conversationId,
        },
      });
      
      console.log('[WebRTC] Call notification sent');
    } catch (error) {
      console.error('[WebRTC] Failed to send call notification:', error);
      // Don't throw - call should proceed even if notification fails
    }
  }

  // Method to update call log when call is answered
  markCallAsAnswered(): void {
    if (this.currentCallLogId) {
      this.updateCallLog('answered');
    }
  }

  // Method to update call log when call is declined
  markCallAsDeclined(): void {
    if (this.currentCallLogId) {
      this.updateCallLog('declined');
    }
  }

  // Method to update call log when call is missed
  markCallAsMissed(): void {
    if (this.currentCallLogId) {
      this.updateCallLog('missed');
    }
  }

  // Verify transceivers are set to sendrecv for bidirectional communication
  private verifyTransceivers() {
    const transceivers = this.pc?.getTransceivers() || [];
    transceivers.forEach(t => {
      console.log(`[WebRTC] Transceiver: kind=${t.receiver.track?.kind}, direction=${t.direction}, currentDirection=${t.currentDirection}`);
      if (t.direction !== 'sendrecv') {
        t.direction = 'sendrecv';
        console.log(`[WebRTC] Set transceiver direction to sendrecv`);
      }
    });
  }

  // Get detailed connection statistics for debugging
  async getConnectionStats(): Promise<{
    connectionState: RTCPeerConnectionState | null;
    iceConnectionState: RTCIceConnectionState | null;
    iceGatheringState: RTCIceGatheringState | null;
    transceivers: Array<{kind: string; direction: RTCRtpTransceiverDirection}>;
    bytesSent: number;
    bytesReceived: number;
  }> {
    if (!this.pc) {
      return {
        connectionState: null,
        iceConnectionState: null,
        iceGatheringState: null,
        transceivers: [],
        bytesSent: 0,
        bytesReceived: 0,
      };
    }
    
    const stats = await this.pc.getStats();
    let bytesSent = 0, bytesReceived = 0;
    
    stats.forEach(report => {
      if (report.type === 'outbound-rtp') bytesSent += (report as any).bytesSent || 0;
      if (report.type === 'inbound-rtp') bytesReceived += (report as any).bytesReceived || 0;
    });
    
    return {
      connectionState: this.pc.connectionState,
      iceConnectionState: this.pc.iceConnectionState,
      iceGatheringState: this.pc.iceGatheringState,
      transceivers: this.pc.getTransceivers().map(t => ({
        kind: t.receiver.track?.kind || 'unknown',
        direction: t.direction
      })),
      bytesSent,
      bytesReceived
    };
  }

  // Start periodic stats logging for debugging
  private startStatsLogging() {
    this.statsLogInterval = setInterval(async () => {
      const stats = await this.getConnectionStats();
      console.log('[WebRTC Stats]', {
        state: stats.connectionState,
        ice: stats.iceConnectionState,
        bytesSent: stats.bytesSent,
        bytesReceived: stats.bytesReceived,
        transceivers: stats.transceivers
      });
    }, 5000);
  }

  // Stop stats logging
  private stopStatsLogging() {
    if (this.statsLogInterval) {
      clearInterval(this.statsLogInterval);
      this.statsLogInterval = null;
    }
  }
}