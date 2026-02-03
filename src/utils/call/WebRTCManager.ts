import { CallType, CallState } from "./types";

export interface WebRTCManagerOptions {
    iceServers?: RTCIceServer[];
    onLocalStream: (stream: MediaStream) => void;
    onRemoteStream: (stream: MediaStream) => void;
    onStateChange: (state: CallState) => void;
    onSignal: (message: any) => void;
    onError: (code: string, message: string) => void;
}

export class WebRTCManager {
    private pc: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;
    private options: WebRTCManagerOptions;
    private callType: CallType = "voice";
    private sessionId: string | null = null;

    private pendingIceCandidates: RTCIceCandidate[] = [];
    private remoteDescriptionSet = false;

    constructor(options: WebRTCManagerOptions) {
        this.options = options;
    }

    async setup(type: CallType, sessionId: string) {
        this.callType = type;
        this.sessionId = sessionId;
        this.remoteDescriptionSet = false;
        this.pendingIceCandidates = [];

        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === "video"
            });
            this.options.onLocalStream(this.localStream);

            await this.createPeerConnection();
            this.localStream.getTracks().forEach(track => {
                if (this.pc && this.localStream) {
                    this.pc.addTrack(track, this.localStream);
                }
            });

            return this.localStream;
        } catch (error: any) {
            this.options.onError("MEDIA_ERROR", error.message);
            throw error;
        }
    }

    private async createPeerConnection() {
        if (this.pc) this.pc.close();

        this.pc = new RTCPeerConnection({
            iceServers: this.options.iceServers || [{ urls: "stun:stun.l.google.com:19302" }]
        });

        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.options.onSignal({
                    type: "ice",
                    candidate: event.candidate,
                    session_id: this.sessionId
                });
            }
        };

        this.pc.ontrack = (event) => {
            if (event.streams[0]) {
                this.remoteStream = event.streams[0];
                this.options.onRemoteStream(event.streams[0]);
            }
        };

        this.pc.onconnectionstatechange = () => {
            const state = this.pc?.connectionState;
            console.log("[WebRTCManager] Connection state:", state);

            if (state === "connected") {
                this.options.onStateChange("connected");
            } else if (state === "failed") {
                this.options.onError("ICE_CONNECTION_FAILED", "Connection failed after retries");
            } else if (state === "disconnected") {
                // Handled by service for auto-reconnect if needed
            }
        };
    }

    async createOffer() {
        if (!this.pc) throw new Error("PeerConnection not initialized");
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        return offer;
    }

    async handleOffer(offerSdp: any) {
        if (!this.pc) throw new Error("PeerConnection not initialized");
        await this.pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
        this.remoteDescriptionSet = true;
        await this.flushPendingIceCandidates();

        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        return answer;
    }

    async handleAnswer(answerSdp: any) {
        if (!this.pc) throw new Error("PeerConnection not initialized");
        await this.pc.setRemoteDescription(new RTCSessionDescription(answerSdp));
        this.remoteDescriptionSet = true;
        await this.flushPendingIceCandidates();
    }

    async addIceCandidate(candidate: any) {
        const iceCandidate = new RTCIceCandidate(candidate);
        if (!this.remoteDescriptionSet) {
            this.pendingIceCandidates.push(iceCandidate);
        } else if (this.pc) {
            await this.pc.addIceCandidate(iceCandidate);
        }
    }

    private async flushPendingIceCandidates() {
        if (!this.pc) return;
        for (const candidate of this.pendingIceCandidates) {
            await this.pc.addIceCandidate(candidate);
        }
        this.pendingIceCandidates = [];
    }

    toggleAudio(enabled?: boolean) {
        if (!this.localStream) return;
        const track = this.localStream.getAudioTracks()[0];
        if (track) {
            track.enabled = enabled !== undefined ? enabled : !track.enabled;
        }
    }

    toggleVideo(enabled?: boolean) {
        if (!this.localStream) return;
        const track = this.localStream.getVideoTracks()[0];
        if (track) {
            track.enabled = enabled !== undefined ? enabled : !track.enabled;
        }
    }

    async switchCamera() {
        if (!this.localStream || this.callType !== "video") return;
        // Logic similar to WebRTCManagerV2 switchCamera
        // Simplified for now, can be expanded if needed
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
        this.remoteDescriptionSet = false;
        this.pendingIceCandidates = [];
    }
}
