import { supabase } from '@/integrations/supabase/client';

export class WebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private conversationId: string;
  private currentUserId: string;
  private isInitiator: boolean = false;
  private callStartTime: Date | null = null;
  private currentCallLogId: string | null = null;
  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private hasRemoteDescription: boolean = false;

  constructor(
    conversationId: string,
    currentUserId: string,
    private onRemoteStream: (stream: MediaStream) => void,
    private onCallEnd: () => void
  ) {
    this.conversationId = conversationId;
    this.currentUserId = currentUserId;
    this.setupPeerConnection();
  }

  private setupPeerConnection() {
    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        {
          urls: [
            'turn:openrelay.metered.ca:80',
            'turn:openrelay.metered.ca:443',
            'turns:openrelay.metered.ca:443',
          ],
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
      ]
    });

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    this.pc.ontrack = (event) => {
      console.log('Received remote stream');
      this.remoteStream = event.streams[0];
      this.onRemoteStream(this.remoteStream);
    };

    this.pc.onconnectionstatechange = async () => {
      console.log('Connection state:', this.pc?.connectionState);
      
      if (this.pc?.connectionState === 'connected') {
        console.log('WebRTC connection established successfully');
      }
      
      if (this.pc?.connectionState === 'failed') {
        console.log('Connection failed, attempting ICE restart');
        try {
          const offer = await this.pc.createOffer({ iceRestart: true });
          await this.pc.setLocalDescription(offer);
          await this.sendSignalingMessage({
            type: 'offer',
            offer: offer,
            isRestart: true
          });
        } catch (error) {
          console.error('ICE restart failed:', error);
          this.onCallEnd();
        }
      }
      
      if (this.pc?.connectionState === 'disconnected' || 
          this.pc?.connectionState === 'closed') {
        this.onCallEnd();
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
          audio: true,
          video: video ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          } : false
        };
        
        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Got local media stream:', this.localStream.getTracks().map(t => `${t.kind}: ${t.label}`));
      } catch (mediaError) {
        console.error('Error getting user media:', mediaError);
        if (mediaError.name === 'NotAllowedError') {
          throw new Error('Camera or microphone access denied. Please allow access and try again.');
        } else if (mediaError.name === 'NotFoundError') {
          throw new Error('No camera or microphone found on this device.');
        } else {
          throw new Error(`Media access error: ${mediaError.message}`);
        }
      }

      this.callStartTime = new Date();

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        console.log('Adding track:', track.kind);
        this.pc?.addTrack(track, this.localStream!);
      });

      // Create offer
      const offer = await this.pc!.createOffer();
      await this.pc!.setLocalDescription(offer);
      console.log('Created offer');

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
      
      // Get user media
      console.log('Answering call with video:', video);
      const constraints = {
        audio: true,
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false
      };
      
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Got local media stream for answer:', this.localStream.getTracks().map(t => `${t.kind}: ${t.label}`));

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        this.pc?.addTrack(track, this.localStream!);
      });

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
          console.log('Processing incoming offer');
          // Handle incoming call offer
          await this.pc!.setRemoteDescription(message.offer);
          this.hasRemoteDescription = true;
          await this.processPendingIceCandidates();
          break;
          
        case 'answer':
          console.log('Processing call answer');
          // Handle call answer
          await this.pc!.setRemoteDescription(message.answer);
          this.hasRemoteDescription = true;
          await this.processPendingIceCandidates();
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
          this.endCall();
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

  endCall() {
    // Calculate duration and update call log
    if (this.callStartTime && this.currentCallLogId) {
      const duration = Math.floor((new Date().getTime() - this.callStartTime.getTime()) / 1000);
      this.updateCallLog('ended', duration);
    }

    // Send end call signal
    this.sendSignalingMessage({ type: 'call-end' });

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

    this.onCallEnd();
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

      if (status === 'ended' && duration !== undefined) {
        updateData.end_time = new Date().toISOString();
        updateData.duration_seconds = duration;
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
}