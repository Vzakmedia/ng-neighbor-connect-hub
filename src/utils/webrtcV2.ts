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
  
  // Session tracking and ICE candidate queue
  private callSessionId: string | null = null;
  private pendingIceCandidates: RTCIceCandidate[] = [];
  private remoteDescriptionSet: boolean = false;
  private ringingTimeoutRef: NodeJS.Timeout | null = null;
  private disconnectTimeoutRef: NodeJS.Timeout | null = null;

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
    // Close existing connection if any
    if (this.pc) {
      console.log("Closing existing peer connection");
      this.pc.close();
      this.pc = null;
    }

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
          type: "ice",
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
        // Clear disconnect timeout if we reconnect
        if (this.disconnectTimeoutRef) {
          clearTimeout(this.disconnectTimeoutRef);
          this.disconnectTimeoutRef = null;
        }
      } else if (this.pc?.connectionState === "failed") {
        console.warn("Connection failed - attempting ICE restart");
        this.logCallError("Connection failed - attempting restart");
        this.restartIce();
      } else if (this.pc?.connectionState === "disconnected") {
        console.warn("Connection disconnected - waiting 5s before ICE restart");
        this.logCallError("Connection disconnected");
        // Wait 5 seconds, then attempt ICE restart if still disconnected
        if (this.disconnectTimeoutRef) {
          clearTimeout(this.disconnectTimeoutRef);
        }
        this.disconnectTimeoutRef = setTimeout(() => {
          if (this.pc?.connectionState === "disconnected") {
            console.log("Still disconnected after 5s - attempting ICE restart");
            this.restartIce();
          }
        }, 5000);
      }
    };

    // Handle renegotiation (e.g., camera switching)
    this.pc.onnegotiationneeded = async () => {
      if (this.callState !== "connected") {
        console.log("Skipping negotiation - not connected yet");
        return;
      }
      
      try {
        console.log("Renegotiation needed - creating new offer");
        const offer = await this.pc!.createOffer();
        await this.pc!.setLocalDescription(offer);
        
        await this.sendSignal({
          type: "renegotiate",
          sdp: offer,
          session_id: this.callSessionId
        });
        
        this.logAnalytics("renegotiation_initiated", { reason: "negotiation_needed" });
      } catch (error) {
        console.error("Error during renegotiation:", error);
        this.logCallError(`Renegotiation failed: ${error}`);
      }
    };
  }

  async startCall(type: CallType) {
    // Clean up any existing connection first
    if (this.pc) {
      console.log("Cleaning up existing peer connection before new call");
      this.cleanup();
    }

    this.callType = type;
    this.updateCallState("initiating");

    // Generate new session ID for this call
    this.callSessionId = crypto.randomUUID();
    console.log("Starting new call with session_id:", this.callSessionId);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video"
      });

      this.localStream = stream;
      this.onLocalStream?.(stream);

      await this.createPeerConnection();
      stream.getTracks().forEach(track => this.pc?.addTrack(track, stream));

      const offer = await this.pc!.createOffer();
      await this.pc!.setLocalDescription(offer);

      await this.createCallLog();
      await this.sendSignal({
        type: "offer",
        sdp: offer,
        callType: type,
        session_id: this.callSessionId
      });

      // Move to ringing state after offer is sent
      this.updateCallState("ringing");

      // Start 30s timeout for no answer
      this.startRingingTimeout();

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
    // Clean up any existing connection first
    if (this.pc) {
      console.log("Cleaning up existing peer connection before answering");
      this.cleanup();
    }

    // Store the session ID from the incoming offer
    this.callSessionId = callData.message.session_id;
    console.log("[WebRTC] Answering call", {
      session_id: this.callSessionId,
      call_type: type,
      sender_id: callData.sender_id,
      has_sdp: !!callData.message?.sdp
    });

    this.callType = type;
    this.updateCallState("connecting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video"
      });

      this.localStream = stream;
      this.onLocalStream?.(stream);

      await this.createPeerConnection();
      
      // CRITICAL FIX: Set remote description BEFORE adding tracks
      await this.pc!.setRemoteDescription(new RTCSessionDescription(callData.message.sdp));
      
      // Mark remote description as set and flush pending ICE candidates
      this.remoteDescriptionSet = true;
      await this.flushPendingIceCandidates();

      // Now add local tracks after remote description is set
      stream.getTracks().forEach(track => this.pc?.addTrack(track, stream));

      const answer = await this.pc!.createAnswer();
      await this.pc!.setLocalDescription(answer);

      await this.sendSignal({
        type: "answer",
        sdp: answer,
        session_id: this.callSessionId
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
    this.clearRingingTimeout();
    await this.sendSignal({ type: "decline" });
    await this.updateCallLogStatus("declined");
    this.cleanup();
  }

  async endCall() {
    this.clearRingingTimeout();
    const duration = this.callStartTime ? Math.floor((Date.now() - this.callStartTime) / 1000) : 0;
    
    await this.sendSignal({ type: "end" });
    await this.updateCallLogStatus("ended", duration);
    this.logCallEnded(duration);
    this.cleanup();
  }

  async handleSignalingMessage(message: any) {
    if (!message.message) return;

    const { type, sdp, candidate, session_id } = message.message;

    try {
      if (type === "offer") {
        // Dedupe check: Only accept first offer for new session
        if (this.callSessionId && this.callSessionId === session_id) {
          console.log("Ignoring duplicate offer for session:", session_id);
          return;
        }
        
        console.log("Received new offer with session_id:", session_id);
        this.onIncomingCall?.(message);
      } else if (type === "answer" && this.pc) {
        console.log("Received answer for session:", session_id);
        await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
        
        // Mark remote description as set and flush pending ICE candidates
        this.remoteDescriptionSet = true;
        await this.flushPendingIceCandidates();
      } else if ((type === "ice" || type === "ice-candidate") && candidate) {
        console.log("Received ICE candidate for session:", session_id);
        
        if (!this.pc) {
          console.warn("No peer connection available for ICE candidate");
          return;
        }

        // Queue ICE candidates if remote description not set yet
        if (!this.remoteDescriptionSet) {
          console.log("Queueing ICE candidate (remote description not set)");
          this.pendingIceCandidates.push(new RTCIceCandidate(candidate));
        } else {
          // Add immediately if remote description is set
          await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } else if (type === "restart" && this.pc) {
        console.log("Received ICE restart signal from peer");
        await this.handleRemoteIceRestart(sdp);
      } else if (type === "renegotiate" && this.pc) {
        console.log("Received renegotiation offer from peer");
        await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        await this.sendSignal({
          type: "renegotiate-answer",
          sdp: answer,
          session_id: this.callSessionId
        });
        this.logAnalytics("renegotiation_answered", { success: true });
      } else if (type === "renegotiate-answer" && this.pc) {
        console.log("Received renegotiation answer from peer");
        await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
        this.logAnalytics("renegotiation_completed", { success: true });
      } else if (type === "timeout") {
        console.log("Call timed out (no answer) for session:", session_id);
        this.updateCallState("ended");
        this.cleanup();
      } else if (type === "end" || type === "decline") {
        console.log("Call ended/declined for session:", session_id);
        this.updateCallState("ended");
        this.cleanup();
      }
    } catch (error) {
      console.error("Error handling signaling message:", error);
      this.logCallError(`Signaling error: ${error}`);
    }
  }

  private async flushPendingIceCandidates() {
    if (this.pendingIceCandidates.length === 0) return;

    console.log(`Flushing ${this.pendingIceCandidates.length} pending ICE candidates`);
    
    for (const candidate of this.pendingIceCandidates) {
      try {
        await this.pc?.addIceCandidate(candidate);
      } catch (error) {
        console.error("Error adding queued ICE candidate:", error);
      }
    }
    
    this.pendingIceCandidates = [];
  }

  private async restartIce() {
    if (!this.pc || this.callState !== "connected") return;

    try {
      console.log("Initiating ICE restart");
      this.pc.restartIce();

      const offer = await this.pc.createOffer({ iceRestart: true });
      await this.pc.setLocalDescription(offer);

      await this.sendSignal({
        type: "restart",
        sdp: offer,
        session_id: this.callSessionId
      });

      this.logAnalytics("ice_restart", { reason: "connection_failed" });
    } catch (error) {
      console.error("Error during ICE restart:", error);
      this.logCallError(`ICE restart failed: ${error}`);
    }
  }

  private async handleRemoteIceRestart(sdp: any) {
    if (!this.pc) return;

    try {
      console.log("Handling remote ICE restart");
      await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));

      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      await this.sendSignal({
        type: "answer",
        sdp: answer,
        session_id: this.callSessionId
      });

      this.logAnalytics("ice_restart_response", { success: true });
    } catch (error) {
      console.error("Error handling remote ICE restart:", error);
      this.logCallError(`Remote ICE restart handling failed: ${error}`);
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
    this.clearRingingTimeout();
    
    if (this.disconnectTimeoutRef) {
      clearTimeout(this.disconnectTimeoutRef);
      this.disconnectTimeoutRef = null;
    }

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
    this.currentCallLogId = null;
    this.callSessionId = null;
    this.pendingIceCandidates = [];
    this.remoteDescriptionSet = false;
    this.updateCallState("idle");
  }

  private startRingingTimeout() {
    this.clearRingingTimeout();
    
    this.ringingTimeoutRef = setTimeout(async () => {
      console.log("Call timeout - no answer after 30s");
      await this.sendSignal({ type: "timeout", session_id: this.callSessionId });
      await this.updateCallLogStatus("timeout");
      this.logCallError("Call timeout - no answer");
      this.cleanup();
    }, 30000); // 30 seconds
  }

  private clearRingingTimeout() {
    if (this.ringingTimeoutRef) {
      clearTimeout(this.ringingTimeoutRef);
      this.ringingTimeoutRef = null;
    }
  }

  // Database operations
  private async sendSignal(message: any, retryCount = 0): Promise<void> {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // Start with 1 second
    
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

      // Add required fields to message including session_id
      const fullMessage = {
        ...message,
        id: crypto.randomUUID(),
        sender_id: user.id,
        conversation_id: this.conversationId,
        receiver_id: receiverId,
        session_id: this.callSessionId || message.session_id,
        timestamp: new Date().toISOString()
      };

      console.log("[WebRTC] Sending signal", {
        type: message.type,
        session_id: fullMessage.session_id,
        retryCount
      });

      const { error } = await supabase.functions.invoke("insert-call-signal", {
        body: {
          message: fullMessage,
          conversation_id: this.conversationId,
          receiver_id: receiverId,
          session_id: this.callSessionId || message.session_id
        }
      });

      if (error) throw error;
      
      console.log("[WebRTC] Signal sent successfully", {
        type: message.type,
        session_id: fullMessage.session_id
      });
    } catch (error: any) {
      console.error(`[WebRTC] Error sending signal (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, {
        error,
        message: error?.message,
        type: message.type,
        session_id: this.callSessionId
      });
      
      // Retry with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`[WebRTC] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendSignal(message, retryCount + 1);
      }
      
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
