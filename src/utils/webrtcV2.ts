import { supabase } from "@/integrations/supabase/client";

type CallType = "voice" | "video";
type CallState = "idle" | "initiating" | "ringing" | "connecting" | "connected" | "ended";

export class WebRTCManagerV2 {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private conversationId: string;
  private currentUserId: string | null = null;
  private callType: CallType = "voice";
  private callState: CallState = "idle";
  private currentCallLogId: string | null = null;
  private callStartTime: number | null = null;

  // Callbacks
  onIncomingCall: ((callData: any) => void) | null = null;
  onCallStateUpdate: ((state: CallState) => void) | null = null;
  onLocalStream: ((stream: MediaStream) => void) | null = null;
  onRemoteStream: ((stream: MediaStream) => void) | null = null;

  constructor(conversationId: string) {
    this.conversationId = conversationId;
    this.init();
  }

  private async init() {
    const { data: { user } } = await supabase.auth.getUser();
    this.currentUserId = user?.id || null;
  }

  private updateCallState(state: CallState) {
    this.callState = state;
    this.onCallStateUpdate?.(state);
  }

  private async createPeerConnection() {
    // Fetch ICE servers configuration from edge function
    let iceServers: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ];

    try {
      const { data } = await supabase.functions.invoke("get-turn-credentials");
      if (data?.iceServers) {
        iceServers = data.iceServers;
        console.log("Using TURN credentials from server");
      }
    } catch (error) {
      console.warn("Failed to fetch TURN credentials, using STUN only:", error);
    }

    const config: RTCConfiguration = { iceServers };

    this.pc = new RTCPeerConnection(config);

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: "ice-candidate",
          candidate: event.candidate
        });
      }
    };

    this.pc.ontrack = (event) => {
      if (event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.onRemoteStream?.(event.streams[0]);
      }
    };

    this.pc.onconnectionstatechange = () => {
      console.log("Connection state:", this.pc?.connectionState);
      if (this.pc?.connectionState === "connected") {
        this.updateCallState("connected");
        this.logCallConnected();
      } else if (this.pc?.connectionState === "failed" || this.pc?.connectionState === "disconnected") {
        this.logCallError("Connection failed or disconnected");
      }
    };
  }

  async startCall(type: CallType) {
    this.callType = type;
    this.updateCallState("initiating");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video"
      });

      this.localStream = stream;
      this.onLocalStream?.(stream);

      this.createPeerConnection();
      stream.getTracks().forEach(track => this.pc?.addTrack(track, stream));

      const offer = await this.pc!.createOffer();
      await this.pc!.setLocalDescription(offer);

      await this.createCallLog();
      await this.sendSignal({
        type: "offer",
        sdp: offer,
        callType: type
      });

      this.callStartTime = Date.now();
      this.logCallInitiated();
    } catch (error) {
      console.error("Error starting call:", error);
      this.updateCallState("idle");
      this.logCallError(`Failed to start call: ${error}`);
      throw error;
    }
  }

  async answerCall(callData: any, type: CallType) {
    this.callType = type;
    this.updateCallState("connecting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video"
      });

      this.localStream = stream;
      this.onLocalStream?.(stream);

      this.createPeerConnection();
      stream.getTracks().forEach(track => this.pc?.addTrack(track, stream));

      await this.pc!.setRemoteDescription(new RTCSessionDescription(callData.message.sdp));

      const answer = await this.pc!.createAnswer();
      await this.pc!.setLocalDescription(answer);

      await this.sendSignal({
        type: "answer",
        sdp: answer
      });

      this.callStartTime = Date.now();
      await this.updateCallLogStatus("answered");
    } catch (error) {
      console.error("Error answering call:", error);
      this.updateCallState("idle");
      this.logCallError(`Failed to answer call: ${error}`);
      throw error;
    }
  }

  async declineCall(callData: any) {
    await this.sendSignal({ type: "decline" });
    await this.updateCallLogStatus("declined");
    this.cleanup();
  }

  async endCall() {
    const duration = this.callStartTime ? Math.floor((Date.now() - this.callStartTime) / 1000) : 0;
    
    await this.sendSignal({ type: "end" });
    await this.updateCallLogStatus("ended", duration);
    this.logCallEnded(duration);
    this.cleanup();
  }

  async handleSignalingMessage(message: any) {
    if (!message.message) return;

    const { type, sdp, candidate } = message.message;

    try {
      if (type === "offer") {
        this.onIncomingCall?.(message);
      } else if (type === "answer" && this.pc) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } else if (type === "ice-candidate" && this.pc && candidate) {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else if (type === "end" || type === "decline") {
        this.updateCallState("ended");
        this.cleanup();
      }
    } catch (error) {
      console.error("Error handling signaling message:", error);
      this.logCallError(`Signaling error: ${error}`);
    }
  }

  toggleAudio() {
    if (!this.localStream) return;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
    }
  }

  toggleVideo() {
    if (!this.localStream) return;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
    }
  }

  async switchCamera() {
    if (!this.localStream || this.callType !== "video") return;

    try {
      const videoTrack = this.localStream.getVideoTracks()[0];
      const currentFacingMode = videoTrack.getSettings().facingMode;
      const newFacingMode = currentFacingMode === "user" ? "environment" : "user";

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: true
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      const sender = this.pc?.getSenders().find(s => s.track?.kind === "video");
      
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
        videoTrack.stop();
        
        this.localStream.removeTrack(videoTrack);
        this.localStream.addTrack(newVideoTrack);
        this.onLocalStream?.(this.localStream);
      }
    } catch (error) {
      console.error("Error switching camera:", error);
    }
  }

  async getConnectionStats() {
    if (!this.pc) return null;

    const stats = await this.pc.getStats();
    const result: any = {};

    stats.forEach(report => {
      if (report.type === "inbound-rtp") {
        result.inbound = report;
      } else if (report.type === "outbound-rtp") {
        result.outbound = report;
      }
    });

    return result;
  }

  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    this.remoteStream = null;
    this.callStartTime = null;
    this.updateCallState("idle");
  }

  // Database operations
  private async sendSignal(message: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const conversationData = await supabase
        .from("direct_conversations")
        .select("user1_id, user2_id")
        .eq("id", this.conversationId)
        .single();

      if (!conversationData.data) throw new Error("Conversation not found");

      const receiverId = conversationData.data.user1_id === user.id 
        ? conversationData.data.user2_id 
        : conversationData.data.user1_id;

      await supabase.functions.invoke("insert-call-signal", {
        body: {
          message,
          conversation_id: this.conversationId,
          receiver_id: receiverId
        }
      });
    } catch (error) {
      console.error("Error sending signal:", error);
      throw error;
    }
  }

  private async createCallLog() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const conversationData = await supabase
        .from("direct_conversations")
        .select("user1_id, user2_id")
        .eq("id", this.conversationId)
        .single();

      if (!conversationData.data) return;

      const receiverId = conversationData.data.user1_id === user.id
        ? conversationData.data.user2_id
        : conversationData.data.user1_id;

      // Use edge function to create call log
      const { data, error } = await supabase.functions.invoke("log-call-event", {
        body: {
          caller_id: user.id,
          receiver_id: receiverId,
          conversation_id: this.conversationId,
          call_type: this.callType,
          status: "initiated",
          started_at: new Date().toISOString(),
        },
      });

      if (error) throw error;
      
      this.currentCallLogId = data?.log_id || null;
      console.log("Call log created:", this.currentCallLogId);
    } catch (error) {
      console.error("Error creating call log:", error);
    }
  }

  private async updateCallLogStatus(status: string, duration?: number) {
    if (!this.currentCallLogId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const conversationData = await supabase
        .from("direct_conversations")
        .select("user1_id, user2_id")
        .eq("id", this.conversationId)
        .single();

      if (!conversationData.data) return;

      const receiverId = conversationData.data.user1_id === user.id
        ? conversationData.data.user2_id
        : conversationData.data.user1_id;

      const body: any = {
        log_id: this.currentCallLogId,
        caller_id: user.id,
        receiver_id: receiverId,
        conversation_id: this.conversationId,
        call_type: this.callType,
        status,
        started_at: this.callStartTime ? new Date(this.callStartTime).toISOString() : new Date().toISOString(),
      };

      if (status === "connected" && this.callStartTime) {
        body.connected_at = new Date().toISOString();
      }

      if (duration !== undefined) {
        body.ended_at = new Date().toISOString();
      }

      const { error } = await supabase.functions.invoke("log-call-event", {
        body,
      });

      if (error) throw error;
      console.log("Call log updated:", status);
    } catch (error) {
      console.error("Error updating call log:", error);
    }
  }

  // Analytics logging
  private async logCallInitiated() {
    await this.logAnalytics("call_initiated", { callType: this.callType });
  }

  private async logCallConnected() {
    const connectionTime = this.callStartTime ? Date.now() - this.callStartTime : 0;
    await this.logAnalytics("call_connected", { 
      callType: this.callType,
      connectionTimeMs: connectionTime 
    });
  }

  private async logCallEnded(duration: number) {
    await this.logAnalytics("call_ended", { 
      callType: this.callType,
      durationSeconds: duration 
    });
  }

  private async logCallError(message: string) {
    await this.logAnalytics("call_error", { error: message });
  }

  private async logAnalytics(eventType: string, data: any) {
    try {
      await supabase.from("call_analytics").insert({
        conversation_id: this.conversationId,
        call_log_id: this.currentCallLogId,
        event_type: eventType,
        event_data: data,
        user_id: this.currentUserId
      });
    } catch (error) {
      console.error("Error logging analytics:", error);
    }
  }
}
