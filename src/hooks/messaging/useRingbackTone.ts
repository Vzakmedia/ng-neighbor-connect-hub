import { useEffect, useRef } from 'react';

export const useRingbackTone = (isPlaying: boolean) => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isPlaying) {
            startTone();
        } else {
            stopTone();
        }

        return () => {
            stopTone();
        };
    }, [isPlaying]);

    const startTone = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const ctx = audioContextRef.current;

        // Play the tone in a loop (2s on, 4s off is standard US ringback, or 0.4s on 0.2s off 0.4s on 2.0s off for UK)
        // Let's do a simple 1s tone every 3 seconds for a generic "calling" sound

        const playBeep = () => {
            if (!ctx) return;

            // Create oscillator
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, ctx.currentTime); // 440Hz + 480Hz is standard US ringback

            // Dual tone for more realistic ringback
            const osc2 = ctx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(480, ctx.currentTime);

            // Connect
            osc.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            // Envelope
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1); // Soft attack
            gain.gain.setValueAtTime(0.1, ctx.currentTime + 1.8);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0); // Soft release

            // Start/Stop
            osc.start(ctx.currentTime);
            osc2.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 2.0);
            osc2.stop(ctx.currentTime + 2.0);
        };

        // Play immediately
        playBeep();

        // Loop
        intervalRef.current = setInterval(playBeep, 4000); // Every 4 seconds
    };

    const stopTone = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Clean up Web Audio if needed (usually just stopping oscillator is enough, 
        // but here we create one per beep so just clearing interval stops new ones)
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    };
};
