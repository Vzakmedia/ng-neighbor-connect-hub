
import React, { useState } from 'react';
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
import { Track } from 'livekit-client';
import { Loader2 } from 'lucide-react';

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

    // If audio only, we can configure logic here to turn off video track initially
    // but LiveKitRoom connect options usually handle this.

    return (
        <div className="h-full w-full bg-black relative">
            <LiveKitRoom
                token={token}
                serverUrl={serverUrl}
                connect={true}
                video={!audioOnly}
                audio={true}
                onConnected={() => setConnected(true)}
                onDisconnected={() => {
                    setConnected(false);
                    onDisconnected?.();
                }}
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
