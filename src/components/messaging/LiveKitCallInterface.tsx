
import React, { useState, useEffect } from 'react';
import {
    LiveKitRoom,
    VideoConference,
    GridLayout,
    ParticipantTile,
    RoomAudioRenderer,
    ControlBar,
    useTracks,
    TrackReferenceOrPlaceholder,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, RoomOptions, VideoPresets, Room } from 'livekit-client';
import { Loader2, Mic, MicOff } from 'lucide-react';
import { useAudioPermissions } from '@/hooks/useAudioPermissions';
import { useToast } from '@/hooks/use-toast';

interface LiveKitCallInterfaceProps {
    token: string;
    serverUrl: string;
    onDisconnected?: () => void;
    audioOnly?: boolean;
}

export const LiveKitCallInterface: React.FC<LiveKitCallInterfaceProps> = ({
    token,
    serverUrl,
    onDisconnected,
    audioOnly = false,
}) => {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { granted, requesting, requestPermission, error: permError } = useAudioPermissions();
    const { toast } = useToast();

    // Request permissions before connecting
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
    }, []);

    // LiveKit room options with optimized audio settings
    const roomOptions: RoomOptions = {
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
            audioPreset: {
                maxBitrate: 20_000,
            },
            dtx: true, // Discontinuous transmission
            red: true, // Redundant encoding
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

    const handleError = (error: Error) => {
        console.error('LiveKit error:', error);
        setError(error.message);
        toast({
            title: 'Call Error',
            description: error.message || 'An error occurred during the call',
            variant: 'destructive',
        });
    };

    const handleDisconnected = () => {
        setConnected(false);
        onDisconnected?.();
    };

    // Show permission error
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

    // Show loading while requesting permissions
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
                onDisconnected={handleDisconnected}
                onError={handleError}
                className="h-full w-full"
                data-lk-theme="default"
            >
                {/* Render standard Video Conference UI */}
                {!audioOnly ? (
                    <VideoConference />
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 flex items-center justify-center">
                            {/* Custom Audio Only View could go here */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 w-full h-full max-h-[80vh]">
                                <MyVideoConference />
                            </div>
                        </div>
                        <ControlBar />
                    </div>
                )}

                {/* Ensure audio is rendered */}
                <RoomAudioRenderer />

                {/* Loading state */}
                {!connected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                        <span className="ml-2 text-white font-medium">Connecting...</span>
                    </div>
                )}
            </LiveKitRoom>
        </div>
    );
};

// Helper component to customize layout if needed, otherwise VideoConference handles it
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
