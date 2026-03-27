
import React, { useState, useEffect, useRef, Component } from 'react';
import {
    LiveKitRoom,
    VideoConference,
    GridLayout,
    ParticipantTile,
    RoomAudioRenderer,
    ControlBar,
    useTracks,
    useRemoteParticipants,
    useRoomContext,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, RoomOptions, VideoPresets, RoomEvent, DisconnectReason } from 'livekit-client';
import { Loader2, Mic, MicOff } from 'lucide-react';
import { useAudioPermissions } from '@/hooks/useAudioPermissions';
import { useToast } from '@/hooks/use-toast';

// Error boundary to prevent LiveKit track race conditions from crashing the call UI
class LiveKitVideoErrorBoundary extends Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error: Error) {
        console.warn('[LiveKit] Recovered from track layout error:', error.message);
        setTimeout(() => this.setState({ hasError: false }), 500);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="h-full w-full bg-black flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
            );
        }
        return this.props.children;
    }
}

// Watches for remote participants and fires callback when the first one joins
function RemoteParticipantWatcher({ onParticipantConnected }: { onParticipantConnected?: () => void }) {
    const remoteParticipants = useRemoteParticipants();
    useEffect(() => {
        if (remoteParticipants.length > 0) {
            onParticipantConnected?.();
        }
    }, [remoteParticipants.length, onParticipantConnected]);
    return null;
}

/**
 * Listens to the Room's Disconnected event INSIDE LiveKitRoom so we have access
 * to DisconnectReason before any outer callbacks fire.
 *
 * - CLIENT_INITIATED  → user clicked Leave → call onLeave() to end the call
 * - anything else     → unexpected drop    → call onUnexpectedDisconnect() to show reconnecting
 */
function DisconnectWatcher({
    onLeave,
    onUnexpectedDisconnect,
}: {
    onLeave: () => void;
    onUnexpectedDisconnect: () => void;
}) {
    const room = useRoomContext();
    // Keep stable refs so the effect never re-runs on re-render
    const onLeaveRef = useRef(onLeave);
    const onUnexpectedRef = useRef(onUnexpectedDisconnect);
    useEffect(() => { onLeaveRef.current = onLeave; });
    useEffect(() => { onUnexpectedRef.current = onUnexpectedDisconnect; });

    useEffect(() => {
        const handler = (reason?: DisconnectReason) => {
            if (reason === DisconnectReason.CLIENT_INITIATED) {
                onLeaveRef.current();
            } else {
                onUnexpectedRef.current();
            }
        };
        room.on(RoomEvent.Disconnected, handler);
        return () => { room.off(RoomEvent.Disconnected, handler); };
    }, [room]);

    return null;
}

interface LiveKitCallInterfaceProps {
    token: string;
    serverUrl: string;
    onDisconnected?: () => void;
    onParticipantConnected?: () => void;
    audioOnly?: boolean;
}

export const LiveKitCallInterface: React.FC<LiveKitCallInterfaceProps> = ({
    token,
    serverUrl,
    onDisconnected,
    onParticipantConnected,
    audioOnly = false,
}) => {
    const [connected, setConnected] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { granted, requesting, requestPermission, error: permError } = useAudioPermissions();
    const { toast } = useToast();

    useEffect(() => {
        const checkAndRequestPermission = async () => {
            if (!granted && !requesting) {
                const result = await requestPermission();
                if (!result) {
                    setError('Microphone permission is required for calls');
                    toast({
                        title: 'Permission Required',
                        description: 'Please enable microphone access to join the call',
                        variant: 'destructive',
                    });
                }
            }
        };
        checkAndRequestPermission();
    }, [granted, requesting, requestPermission, toast]);

    const roomOptions: RoomOptions = {
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
            audioPreset: { maxBitrate: 20_000 },
            dtx: true,
            red: true,
        },
        audioCaptureDefaults: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
        },
        videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution,
        },
    };

    const handleError = (err: Error) => {
        console.error('LiveKit error:', err);
        setError(err.message);
        toast({
            title: 'Call Error',
            description: err.message || 'An error occurred during the call',
            variant: 'destructive',
        });
    };

    // Called by DisconnectWatcher when disconnect reason is CLIENT_INITIATED (user clicked Leave)
    const handleIntentionalLeave = () => {
        setConnected(false);
        setReconnecting(false);
        onDisconnected?.();
    };

    // Called by DisconnectWatcher for unexpected disconnects (network drop etc.)
    const handleUnexpectedDisconnect = () => {
        setConnected(false);
        setReconnecting(true);
        setTimeout(() => setReconnecting(false), 5000);
    };

    // onLeave on VideoConference / ControlBar — room already disconnected at this point,
    // DisconnectWatcher already handled it. This is a no-op safety net.
    const handleLeave = () => {
        setConnected(false);
    };

    if (permError || error) {
        return (
            <div className="h-full w-full bg-black flex items-center justify-center">
                <div className="text-center text-white p-6">
                    <MicOff className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <h3 className="text-xl font-semibold mb-2">Cannot Join Call</h3>
                    <p className="text-gray-300">{permError || error}</p>
                    <button
                        onClick={() => requestPermission()}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                        Request Permission
                    </button>
                </div>
            </div>
        );
    }

    if (requesting || !granted) {
        return (
            <div className="h-full w-full bg-black flex items-center justify-center">
                <div className="text-center text-white">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>Requesting microphone permission...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-black relative">
            <LiveKitRoom
                token={token}
                serverUrl={serverUrl}
                connect={true}
                video={!audioOnly}
                audio={true}
                options={roomOptions}
                onConnected={() => setConnected(true)}
                onError={handleError}
                className="h-full w-full"
                data-lk-theme="default"
            >
                {/* Must be inside LiveKitRoom to access useRoomContext */}
                <DisconnectWatcher
                    onLeave={handleIntentionalLeave}
                    onUnexpectedDisconnect={handleUnexpectedDisconnect}
                />
                <RemoteParticipantWatcher onParticipantConnected={onParticipantConnected} />

                {!audioOnly ? (
                    <LiveKitVideoErrorBoundary>
                        <VideoConference onLeave={handleLeave} />
                    </LiveKitVideoErrorBoundary>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 flex items-center justify-center overflow-hidden">
                            <div className="w-full h-full p-4">
                                <LiveKitVideoErrorBoundary>
                                    <MyVideoConference />
                                </LiveKitVideoErrorBoundary>
                            </div>
                        </div>
                        <ControlBar onLeave={handleLeave} />
                    </div>
                )}

                <RoomAudioRenderer />

                {/* Reconnecting overlay — only for unexpected drops */}
                {reconnecting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                        <span className="ml-2 text-white font-medium">Reconnecting...</span>
                    </div>
                )}

                {/* Initial connecting state */}
                {!connected && !reconnecting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                        <span className="ml-2 text-white font-medium">Connecting...</span>
                    </div>
                )}
            </LiveKitRoom>
        </div>
    );
};

function MyVideoConference() {
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false }
    );
    return (
        <GridLayout tracks={tracks} style={{ height: '100%' }}>
            <ParticipantTile />
        </GridLayout>
    );
}
