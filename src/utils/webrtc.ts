import { supabase } from '@/integrations/supabase/client';

export class WebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private conversationId: string;
  private currentUserId: string;
  private isInitiator: boolean = false;

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
        { urls: 'stun:stun1.l.google.com:19302' }
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

    this.pc.onconnectionstatechange = () => {
      console.log('Connection state:', this.pc?.connectionState);
      if (this.pc?.connectionState === 'disconnected' || 
          this.pc?.connectionState === 'failed' ||
          this.pc?.connectionState === 'closed') {
        this.onCallEnd();
      }
    };
  }

  async startCall(video: boolean = false) {
    try {
      this.isInitiator = true;
      
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: video
      });

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        this.pc?.addTrack(track, this.localStream!);
      });

      // Create offer
      const offer = await this.pc!.createOffer();
      await this.pc!.setLocalDescription(offer);

      // Send offer through signaling
      await this.sendSignalingMessage({
        type: 'offer',
        offer: offer,
        callType: video ? 'video' : 'audio'
      });

      console.log('Call initiated');
      return this.localStream;
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }

  async answerCall(offer: RTCSessionDescriptionInit, video: boolean = false) {
    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: video
      });

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        this.pc?.addTrack(track, this.localStream!);
      });

      // Set remote description (offer)
      await this.pc!.setRemoteDescription(offer);

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
      switch (message.type) {
        case 'offer':
          // Handle incoming call offer
          await this.pc!.setRemoteDescription(message.offer);
          break;
          
        case 'answer':
          // Handle call answer
          await this.pc!.setRemoteDescription(message.answer);
          break;
          
        case 'ice-candidate':
          // Handle ICE candidate
          await this.pc!.addIceCandidate(message.candidate);
          break;
          
        case 'call-end':
          this.endCall();
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
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

    this.onCallEnd();
  }

  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream() {
    return this.remoteStream;
  }
}