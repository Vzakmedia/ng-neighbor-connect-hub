import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

// Types
export type CallState = 'idle' | 'initiating' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'failed';

type SignalingMessage = {
  id: string;
  type: 'offer' | 'answer' | 'ice' | 'end' | 'restart' | 'busy';
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  timestamp?: string;
  metadata?: any;
};

type WebRTCManagerOptions = {
  conversationId: string;
  currentUserId: string;
  onRemoteStream?: (stream: MediaStream) => void;
  onCallStateChange?: (state: CallState) => void;
  onCallEnd?: (reason?: 'ended' | 'declined' | 'failed' | 'disconnected') => void;
  onOfferSent?: () => void;
  onAnswerReceived?: () => void;
  onError?: (err: Error | string) => void;
};

export class WebRTCManager {
  // Core properties
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private remoteAudioEl: HTMLAudioElement | null = null;
  
  // Configuration
  private conversationId: string;
  private currentUserId: string;
  private otherUserId: string = '';
  
  // Call state
  private callState: CallState = 'idle';
  private callStartTime: Date | null = null;
  private callConnectedTime: Date | null = null;
  private currentCallLogId: string | null = null;
  private isEnding: boolean = false;
  private currentFacingMode: 'user' | 'environment' = 'user';
  
  // Analytics tracking
  private callInitiatedAt: Date | null = null;
  
  // ICE handling
  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private hasRemoteDescription: boolean = false;
  private iceRestartAttempts: number = 0;
  private maxIceRestarts: number = 3;
  
  // Message deduplication
  private seenMessages = new Set<string>();
  
  // Negotiation state tracking
  private isInitialNegotiation: boolean = false;
  
  // Stats logging
  private statsLogInterval: NodeJS.Timeout | null = null;
  
  // Realtime subscription
  private subscription: any = null;
  
  // Callbacks
  private onRemoteStream?: (stream: MediaStream) => void;
  private onCallStateChange?: (state: CallState) => void;
  private onCallEnd?: (reason?: 'ended' | 'declined' | 'failed' | 'disconnected') => void;
  private onOfferSent?: () => void;
  private onAnswerReceived?: () => void;
  private onError?: (err: Error | string) => void;

  constructor(opts: WebRTCManagerOptions) {
    this.conversationId = opts.conversationId;
    this.currentUserId = opts.currentUserId;
    this.onRemoteStream = opts.onRemoteStream;
    this.onCallStateChange = opts.onCallStateChange;
    this.onCallEnd = opts.onCallEnd;
    this.onOfferSent = opts.onOfferSent;
    this.onAnswerReceived = opts.onAnswerReceived;
    this.onError = opts.onError;

    // Create remote audio element for playback
    this.remoteAudioEl = document.createElement('audio');
    this.remoteAudioEl.autoplay = true;
    this.remoteAudioEl.setAttribute('playsinline', 'true');
    this.remoteAudioEl.muted = false;

    this.initializeOtherUserId();
    this.subscribeToSignaling();
  }

  // =====================
  // Public API Methods
  // =====================

  async startCall(video: boolean = false): Promise<MediaStream> {
    try {
      this._setCallState('initiating');
      this.callInitiatedAt = new Date();
      console.log('Starting call - video:', video);

      // Get other user ID for call log
      if (!this.otherUserId) {
        this.otherUserId = await this.getOtherUserId();
      }

      // Create call log entry
      await this.createCallLog(video ? 'video' : 'voice');

      // Log call initiation
      await this._logCallEvent('call_initiated', {
        callType: video ? 'video' : 'voice',
        deviceType: this._getDeviceType()
      });

      // Get local media
      await this._initLocalMedia({ audio: true, video });
      this.callStartTime = new Date();

      // Create peer connection with TURN credentials
      await this._createPeerConnection();

      // Set initial negotiation flag to prevent race condition
      this.isInitialNegotiation = true;

      // Set up transceivers and add tracks
      await this._ensureTransceiversAndSenders();

      // Create offer
      const offer = await this.pc!.createOffer();
      await this.pc!.setLocalDescription(offer);
      
      // Reset flag after initial negotiation is complete
      this.isInitialNegotiation = false;
      
      console.log('Created offer');

      // Send push notification
      await this.sendCallNotification(video);

      // Send offer via signaling with retry
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await this._sendSignalingMessage({
            id: uuidv4(),
            type: 'offer',
            conversation_id: this.conversationId,
            sender_id: this.currentUserId,
            receiver_id: this.otherUserId,
            sdp: offer,
            timestamp: new Date().toISOString(),
            metadata: { callType: video ? 'video' : 'audio' }
          });
          
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

      this._setCallState('ringing');
      
      // Log call ringing
      await this._logCallEvent('call_ringing', {
        callType: video ? 'video' : 'voice'
      });
      
      console.log('Call initiated successfully');
      return this.localStream!;
    } catch (error) {
      console.error('Error starting call:', error);
      
      // Log call failure
      await this._logCallEvent('call_failed', {
        error: error instanceof Error ? error.message : String(error),
        stage: 'initiation'
      });
      
      if (this.currentCallLogId) {
        await this.updateCallLog('failed');
      }
      this._cleanupPeer();
      this._handleError(error, 'Failed to start call');
      throw error;
    }
  }

  async answerCall(offer: RTCSessionDescriptionInit, video: boolean = false): Promise<MediaStream> {
    try {
      this._setCallState('connecting');
      console.log('Answering call with video:', video);

      this.callStartTime = new Date();

      // Get local media
      await this._initLocalMedia({ audio: true, video });

      // Create peer connection
      await this._createPeerConnection();

      // Set initial negotiation flag to prevent race condition
      this.isInitialNegotiation = true;

      // Set up transceivers and add tracks
      await this._ensureTransceiversAndSenders();

      // Set remote description (offer)
      await this._handleRemoteDescription(offer);

      // Create answer
      const answer = await this.pc!.createAnswer();
      await this.pc!.setLocalDescription(answer);
      
      // Reset flag after initial negotiation is complete
      this.isInitialNegotiation = false;

      // Get other user ID
      if (!this.otherUserId) {
        this.otherUserId = await this.getOtherUserId();
      }

      // Send answer via signaling
      await this._sendSignalingMessage({
        id: uuidv4(),
        type: 'answer',
        conversation_id: this.conversationId,
        sender_id: this.currentUserId,
        receiver_id: this.otherUserId,
        sdp: answer,
        timestamp: new Date().toISOString()
      });

      this._setCallState('connecting');
      console.log('Call answered');
      return this.localStream!;
    } catch (error) {
      console.error('Error answering call:', error);
      this._cleanupPeer();
      this._handleError(error, 'Failed to answer call');
      throw error;
    }
  }

  async endCall(): Promise<void> {
    if (this.isEnding) return;
    this.isEnding = true;

    console.log('Ending call');

    // Calculate duration and log analytics
    if (this.callStartTime && this.currentCallLogId) {
      const duration = Math.floor((new Date().getTime() - this.callStartTime.getTime()) / 1000);
      await this.updateCallLog('ended', duration);
      
      // Log call end with total duration
      await this._logCallEvent('call_ended', {
        total_duration_ms: duration * 1000,
        reason: 'user_initiated'
      });
    }

    // Send end signal
    try {
      await this._sendSignalingMessage({
        id: uuidv4(),
        type: 'end',
        conversation_id: this.conversationId,
        sender_id: this.currentUserId,
        receiver_id: this.otherUserId,
        timestamp: new Date().toISOString(),
        metadata: { reason: 'user' }
      });
    } catch (e) {
      console.log('Failed to send end message', e);
    }

    // Cleanup
    this._cleanupPeer();
    this._setCallState('ended');
    this.onCallEnd?.();
  }

  async handleSignalingMessage(message: any): Promise<void> {
    try {
      // Handle legacy message format (without id)
      const msgId = message.id || uuidv4();
      
      if (this.seenMessages.has(msgId)) {
        console.log('[WebRTCManager] Duplicate message ignored', msgId);
        return;
      }
      this.seenMessages.add(msgId);

      // Prune seen messages if too large
      if (this.seenMessages.size > 2000) {
        this.seenMessages = new Set(Array.from(this.seenMessages).slice(-1000));
      }

      console.log('Handling signaling message:', message.type);
      
      switch (message.type) {
        case 'offer':
          // Handle ICE restart offers
          if (message.isRestart && this.pc?.remoteDescription) {
            console.log('Received ICE restart offer, processing...');
            await this._handleRemoteDescription(message.offer || message.sdp);
            const answer = await this.pc!.createAnswer();
            await this.pc!.setLocalDescription(answer);
            await this._sendSignalingMessage({
              id: uuidv4(),
              type: 'answer',
              conversation_id: this.conversationId,
              sender_id: this.currentUserId,
              receiver_id: this.otherUserId,
              sdp: answer,
              timestamp: new Date().toISOString()
            });
          } else if (this.callState !== 'idle' && this.callState !== 'ended') {
            // Already in call - respond busy
            console.log('Already in call, sending busy signal');
            await this._sendSignalingMessage({
              id: uuidv4(),
              type: 'busy',
              conversation_id: this.conversationId,
              sender_id: this.currentUserId,
              receiver_id: message.sender_id || this.otherUserId,
              timestamp: new Date().toISOString()
            });
          }
          break;

        case 'answer':
          console.log('Processing call answer');
          await this._handleRemoteDescription(message.answer || message.sdp);
          this.onAnswerReceived?.();
          break;

        case 'ice-candidate':
        case 'ice':
          console.log('Processing ICE candidate');
          await this._handleRemoteCandidate(message.candidate);
          break;

        case 'call-end':
        case 'end':
          console.log('Processing call end signal');
          this.isEnding = true;
          this._cleanupPeer();
          this._setCallState('ended');
          this.onCallEnd?.('ended');
          break;

        case 'call-decline':
          console.log('Call was declined');
          this.onCallEnd?.('declined');
          this._cleanupPeer();
          this._setCallState('idle');
          break;

        case 'busy':
          console.log('Remote user is busy');
          this._setCallState('idle');
          this._handleError('User busy', 'Remote user busy');
          this._cleanupPeer();
          break;

        case 'restart':
          if (message.sdp) {
            await this._handleRemoteDescription(message.sdp);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  }

  // Toggle audio using replaceTrack
  async toggleAudio(enabled: boolean): Promise<void> {
    if (!this.localStream || !this.pc) return;
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (!audioTrack) return;

    try {
      audioTrack.enabled = enabled;
      const sender = this.pc.getSenders().find(s => s.track?.kind === 'audio');
      if (sender) {
        await sender.replaceTrack(enabled ? audioTrack : null);
      }
    } catch (err) {
      console.error('toggleAudio error', err);
    }
  }

  // Toggle video using replaceTrack
  async toggleVideo(enabled: boolean): Promise<void> {
    if (!this.pc) return;

    if (!this.localStream && enabled) {
      await this._initLocalMedia({ audio: true, video: true });
    }

    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      videoTrack.enabled = enabled;
      const sender = this.pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(enabled ? videoTrack : null);
      }
    } catch (err) {
      console.error('toggleVideo error', err);
    }
  }

  async switchCamera(): Promise<void> {
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

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // Call log methods
  markCallAsAnswered(): void {
    if (this.currentCallLogId) {
      this.updateCallLog('answered');
    }
  }

  markCallAsDeclined(): void {
    if (this.currentCallLogId) {
      this.updateCallLog('declined');
    }
  }

  markCallAsMissed(): void {
    if (this.currentCallLogId) {
      this.updateCallLog('missed');
    }
  }

  // =====================
  // Private Methods
  // =====================

  private async initializeOtherUserId() {
    this.otherUserId = await this.getOtherUserId();
  }

  private subscribeToSignaling() {
    if (this.subscription) return;

    console.log('[WebRTCManager] Subscribing to signaling for conversation', this.conversationId);

    // Subscribe with optimized server-side filtering by receiver_id
    const channel = supabase.channel(`call_signaling_${this.conversationId}_${this.currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signaling',
          filter: `conversation_id=eq.${this.conversationId},or(receiver_id.eq.${this.currentUserId},receiver_id.is.null)`
        },
        async (payload) => {
          const row = payload.new as any;
          if (!row?.message) return;

          const msg: SignalingMessage = row.message;
          await this.handleSignalingMessage(msg);
        }
      )
      .subscribe();

    this.subscription = channel;
  }

  private unsubscribeSignaling() {
    if (this.subscription) {
      try {
        supabase.removeChannel(this.subscription);
      } catch (e) {
        console.error('Error unsubscribing from signaling:', e);
      }
      this.subscription = null;
    }
  }

  private async _createPeerConnection() {
    if (this.pc) return;

    // Fetch TURN credentials from edge function
    let iceServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
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

    const config: RTCConfiguration = {
      iceServers,
      iceCandidatePoolSize: 10,
    };

    this.pc = new RTCPeerConnection(config);

    // ICE candidate handler
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this._sendSignalingMessage({
          id: uuidv4(),
          type: 'ice',
          conversation_id: this.conversationId,
          sender_id: this.currentUserId,
          receiver_id: this.otherUserId,
          candidate: event.candidate.toJSON(),
          timestamp: new Date().toISOString()
        }).catch(err => console.error('Failed to send ICE candidate', err));
      }
    };

    // Track handler
    this.pc.ontrack = (event) => {
      console.log('[WebRTC] ontrack fired:', {
        kind: event.track.kind,
        trackId: event.track.id,
        streams: event.streams.length,
        enabled: event.track.enabled,
        readyState: event.track.readyState
      });

      // Set remote stream
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else {
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        this.remoteStream.addTrack(event.track);
      }

      // Set audio element srcObject for playback
      if (this.remoteAudioEl && this.remoteStream) {
        this.remoteAudioEl.srcObject = this.remoteStream;
        this.remoteAudioEl.play().catch(async (err) => {
          console.log('Autoplay blocked, attempting to resume audio context', err);
          await this._resumeAudioContext();
          try {
            await this.remoteAudioEl!.play();
          } catch (e) {
            console.error('Failed to play remote audio', e);
          }
        });
      }

      if (this.onRemoteStream && this.remoteStream) {
        this.onRemoteStream(this.remoteStream);
      }
    };

    // Connection state handler
    this.pc.onconnectionstatechange = () => {
      console.log('PC connectionState', this.pc?.connectionState);
      if (!this.pc) return;

      if (this.pc.connectionState === 'connected') {
        this._setCallState('connected');
        this.callConnectedTime = new Date();
        this.updateCallLog('connected');
        this.iceRestartAttempts = 0;
        this._startStatsLogging();
        
        // Log successful connection with connection time
        if (this.callInitiatedAt) {
          const connectionTime = new Date().getTime() - this.callInitiatedAt.getTime();
          this._logCallEvent('call_connected', {
            connection_time_ms: connectionTime,
            ice_connection_state: this.pc.iceConnectionState
          });
        }
      } else if (this.pc.connectionState === 'failed') {
        this._setCallState('failed');
        
        // Log ICE failure
        this._logCallEvent('ice_failed', {
          ice_connection_state: this.pc.iceConnectionState,
          ice_gathering_state: this.pc.iceGatheringState,
          restart_attempts: this.iceRestartAttempts
        });
        
        this._attemptIceRestart();
      } else if (this.pc.connectionState === 'disconnected') {
        setTimeout(() => {
          if (this.pc && this.pc.connectionState !== 'connected') {
            this._attemptIceRestart();
          }
        }, 2000);
      }
    };

    // Negotiation needed handler
    this.pc.onnegotiationneeded = async () => {
      // Skip during initial negotiation to avoid race condition with startCall/answerCall
      if (this.isInitialNegotiation) {
        console.log('Skipping onnegotiationneeded during initial negotiation');
        return;
      }
      
      // Only handle renegotiations (ICE restarts, track changes, etc.)
      try {
        console.log('Negotiation needed - renegotiating');
        const offer = await this.pc!.createOffer();
        await this.pc!.setLocalDescription(offer);
        await this._sendSignalingMessage({
          id: uuidv4(),
          type: 'restart',
          conversation_id: this.conversationId,
          sender_id: this.currentUserId,
          receiver_id: this.otherUserId,
          sdp: offer,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.error('onnegotiationneeded error', e);
      }
    };
  }

  private async _ensureTransceiversAndSenders() {
    if (!this.pc) throw new Error('pc not created');
    if (!this.localStream) {
      console.log('No local stream to attach');
      return;
    }

    // Add audio transceiver if missing
    let audioTransceiver = this.pc.getTransceivers().find(
      t => t.receiver?.track && t.sender?.track?.kind === 'audio'
    );
    if (!audioTransceiver) {
      audioTransceiver = this.pc.addTransceiver('audio', { direction: 'sendrecv' });
    }

    // Add video transceiver if local stream has video
    const hasVideoTrack = this.localStream.getVideoTracks().length > 0;
    let videoTransceiver = this.pc.getTransceivers().find(
      t => t.sender?.track?.kind === 'video'
    );
    if (!videoTransceiver && hasVideoTrack) {
      videoTransceiver = this.pc.addTransceiver('video', { direction: 'sendrecv' });
    }

    // Replace tracks on senders
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack && audioTransceiver) {
      await audioTransceiver.sender.replaceTrack(audioTrack);
    }

    if (hasVideoTrack && videoTransceiver) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        await videoTransceiver.sender.replaceTrack(videoTrack);
      }
    }

    // Also add tracks if no senders exist (legacy compatibility)
    if (!this.pc.getSenders().some(s => s.track)) {
      this.localStream.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));
    }

    // Verify transceivers are set to sendrecv
    this._verifyTransceivers();
  }

  private async _handleRemoteDescription(sdp: any) {
    if (!this.pc) {
      await this._createPeerConnection();
    }
    const desc = new RTCSessionDescription(sdp);
    await this.pc!.setRemoteDescription(desc);
    this.hasRemoteDescription = true;

    // Flush pending candidates
    while (this.pendingIceCandidates.length > 0) {
      const c = this.pendingIceCandidates.shift()!;
      try {
        await this.pc!.addIceCandidate(c);
      } catch (err) {
        console.error('addIceCandidate failed', err);
      }
    }
  }

  private async _handleRemoteCandidate(candidate: RTCIceCandidateInit | undefined) {
    if (!candidate) return;
    
    if (!this.pc || !this.hasRemoteDescription) {
      this.pendingIceCandidates.push(candidate);
    } else {
      try {
        await this.pc.addIceCandidate(candidate);
      } catch (err) {
        console.error('addIceCandidate error', err);
      }
    }
  }

  private async _initLocalMedia({ audio = true, video = false }: { audio?: boolean; video?: boolean }) {
    try {
      if (this.localStream) {
        const hasVideo = this.localStream.getVideoTracks().length > 0;
        if (video && !hasVideo) {
          const newStream = await navigator.mediaDevices.getUserMedia({ audio, video: true });
          newStream.getAudioTracks().forEach(t => this.localStream!.addTrack(t));
          newStream.getVideoTracks().forEach(t => this.localStream!.addTrack(t));
        }
        return this.localStream;
      }

      const audioConstraints: any = audio ? {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000
      } : false;

      const videoConstraints: any = video ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 24, max: 30 },
        facingMode: this.currentFacingMode,
      } : false;

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: videoConstraints,
      });

      return this.localStream;
    } catch (err: any) {
      console.error('Error getting user media:', err);
      
      if (err.name === 'NotAllowedError') {
        throw new Error('Camera or microphone access denied. Please enable permissions and try again.');
      } else if (err.name === 'NotFoundError') {
        const device = video ? 'camera or microphone' : 'microphone';
        throw new Error(`No ${device} found on this device.`);
      } else if (err.name === 'NotReadableError') {
        throw new Error('Your camera or microphone is already in use by another application.');
      } else if (err.name === 'OverconstrainedError') {
        throw new Error('Your device does not meet the video call requirements. Try using voice call instead.');
      } else {
        throw new Error(`Unable to access your device: ${err.message}`);
      }
    }
  }

  private async _sendSignalingMessage(message: SignalingMessage) {
    try {
      // Use edge function for idempotent signaling insert
      const { data, error } = await supabase.functions.invoke('insert-call-signal', {
        body: {
          message,
          conversation_id: this.conversationId,
          receiver_id: message.receiver_id
        }
      });

      if (error) {
        console.error('[WebRTC] Signaling edge function error:', error);
        throw error;
      }

      if (data?.status === 'duplicate') {
        console.log('[WebRTC] Duplicate message ignored by server:', message.id);
      }
    } catch (error) {
      console.error('Error sending signaling message:', error);
      throw error;
    }
  }

  private async _attemptIceRestart() {
    if (!this.pc) return;
    if (this.iceRestartAttempts >= this.maxIceRestarts) {
      // Log final ICE restart failure
      await this._logCallEvent('ice_failed', {
        max_attempts_reached: true,
        attempts: this.iceRestartAttempts
      });
      
      this._handleError('ICE restart failed multiple times', 'ice_restart_failed');
      await this.endCall();
      return;
    }

    this.iceRestartAttempts++;
    const delay = 2000 * Math.pow(2, this.iceRestartAttempts - 1);
    
    // Log ICE restart attempt
    await this._logCallEvent('ice_restart', {
      attempt: this.iceRestartAttempts,
      max_attempts: this.maxIceRestarts,
      delay_ms: delay,
      ice_connection_state: this.pc.iceConnectionState
    });
    
    console.log(`Connection failed, attempting ICE restart ${this.iceRestartAttempts}/${this.maxIceRestarts} in ${delay}ms`);

    setTimeout(async () => {
      try {
        if (!this.pc) return;
        const offer = await this.pc.createOffer({ iceRestart: true });
        await this.pc.setLocalDescription(offer);
        await this._sendSignalingMessage({
          id: uuidv4(),
          type: 'restart',
          conversation_id: this.conversationId,
          sender_id: this.currentUserId,
          receiver_id: this.otherUserId,
          sdp: offer,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('ICE restart createOffer failed', err);
        setTimeout(() => this._attemptIceRestart(), delay);
      }
    }, delay);
  }

  private async _resumeAudioContext() {
    try {
      const w: any = window as any;
      const ctx = w.__webrtcAudioContext || new (window.AudioContext || (window as any).webkitAudioContext)();
      w.__webrtcAudioContext = ctx;
      if (ctx && ctx.state === 'suspended') await ctx.resume();
    } catch (e) {
      console.error('resumeAudioContext error', e);
    }
  }

  private _cleanupPeer() {
    try {
      // Stop stats logging
      if (this.statsLogInterval) {
        clearInterval(this.statsLogInterval);
        this.statsLogInterval = null;
      }

      // Close peer connection
      if (this.pc) {
        try {
          this.pc.getSenders().forEach(s => s.track?.stop());
        } catch (e) { /* ignore */ }
        try {
          this.pc.close();
        } catch (e) { /* ignore */ }
        this.pc = null;
      }

      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(t => {
          try {
            t.stop();
          } catch (_) {}
        });
        this.localStream = null;
      }

      // Stop remote audio playback
      if (this.remoteAudioEl) {
        try {
          this.remoteAudioEl.pause();
          this.remoteAudioEl.srcObject = null;
        } catch (_) {}
      }

      this.remoteStream = null;
      this.pendingIceCandidates = [];
      this.hasRemoteDescription = false;
      this.callStartTime = null;
      this.currentCallLogId = null;
      this.isInitialNegotiation = false;
      
      // Unsubscribe from signaling
      this.unsubscribeSignaling();
    } catch (e) {
      console.error('cleanup error', e);
    }
  }

  private _handleError(err: any, context?: string) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[WebRTCManager] Error', context, message);
    if (this.onError) this.onError(`${context ?? ''}: ${message}`);
  }

  private _setCallState(s: CallState) {
    this.callState = s;
    console.log('[WebRTCManager] State ->', s);
    if (this.onCallStateChange) this.onCallStateChange(s);
  }

  private _verifyTransceivers() {
    const transceivers = this.pc?.getTransceivers() || [];
    transceivers.forEach(t => {
      console.log(`[WebRTC] Transceiver: kind=${t.receiver.track?.kind}, direction=${t.direction}`);
      if (t.direction !== 'sendrecv') {
        t.direction = 'sendrecv';
        console.log('[WebRTC] Set transceiver direction to sendrecv');
      }
    });
  }

  private _startStatsLogging() {
    if (this.statsLogInterval) return;
    this.statsLogInterval = setInterval(async () => {
      try {
        const stats = await this.getConnectionStats();
        console.log('[WebRTC Stats]', {
          state: stats.connectionState,
          ice: stats.iceConnectionState,
          bytesSent: stats.bytesSent,
          bytesReceived: stats.bytesReceived,
          transceivers: stats.transceivers
        });
      } catch (e) { /* ignore */ }
    }, 5000);
  }

  // =====================
  // Analytics Logging
  // =====================

  private async _logCallEvent(
    eventType: 'call_initiated' | 'call_ringing' | 'call_connecting' | 'call_connected' | 'call_ended' | 'call_failed' | 'ice_restart' | 'ice_failed' | 'media_error' | 'signaling_error',
    eventData: Record<string, any> = {}
  ): Promise<void> {
    try {
      const analyticsData: any = {
        call_log_id: this.currentCallLogId,
        user_id: this.currentUserId,
        conversation_id: this.conversationId,
        event_type: eventType,
        event_data: eventData,
        device_type: this._getDeviceType(),
        network_type: this._getNetworkType()
      };

      // Add connection time for connected events
      if (eventType === 'call_connected' && this.callInitiatedAt) {
        analyticsData.connection_time_ms = new Date().getTime() - this.callInitiatedAt.getTime();
      }

      // Add total duration for ended events
      if (eventType === 'call_ended' && this.callStartTime) {
        analyticsData.total_duration_ms = new Date().getTime() - this.callStartTime.getTime();
      }

      // Add ICE connection state
      if (this.pc) {
        analyticsData.ice_connection_state = this.pc.iceConnectionState;
      }

      // Add error message if present
      if (eventData.error) {
        analyticsData.error_message = String(eventData.error);
      }

      const { error } = await supabase
        .from('call_analytics')
        .insert(analyticsData);

      if (error) {
        console.error('[WebRTC Analytics] Failed to log event:', error);
      } else {
        console.log('[WebRTC Analytics] Logged event:', eventType);
      }
    } catch (error) {
      console.error('[WebRTC Analytics] Error logging call event:', error);
    }
  }

  private _getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
      return /iPhone|iPad|iPod/i.test(ua) ? 'ios' : 'android';
    }
    return 'desktop';
  }

  private _getNetworkType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  // =====================
  // Call Logging & Notifications
  // =====================

  private async createCallLog(callType: 'voice' | 'video'): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('call_logs')
        .insert({
          conversation_id: this.conversationId,
          caller_id: this.currentUserId,
          receiver_id: this.otherUserId,
          call_type: callType,
          call_status: 'failed'
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
        updateData.ended_at = new Date().toISOString();
        if (duration !== undefined) {
          updateData.duration_seconds = duration;
        } else if (this.callConnectedTime) {
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
      const { data: callerProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', this.currentUserId)
        .single();

      await supabase.functions.invoke('send-call-notification', {
        body: {
          recipientId: this.otherUserId,
          callerId: this.currentUserId,
          callerName: callerProfile?.display_name || 'Someone',
          callType: isVideoCall ? 'video' : 'audio',
          conversationId: this.conversationId,
        },
      });
      
      console.log('[WebRTC] Call notification sent');
    } catch (error) {
      console.error('[WebRTC] Failed to send call notification:', error);
    }
  }
}
