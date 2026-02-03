import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPinIcon, HomeIcon } from '@heroicons/react/24/outline';
import { SEVERITY_COLORS } from '@/utils/map-utils';

interface SafetyMapOverlayProps {
    alertCount: number;
    onRecenter: () => void;
    showUserLegend: boolean;
}

export const SafetyMapOverlay: React.FC<SafetyMapOverlayProps> = ({
    alertCount,
    onRecenter,
    showUserLegend
}) => {
    return (
        <>
            {/* Recenter Button */}
            <div className="absolute top-28 right-4 z-20">
                <Button
                    size="icon"
                    onClick={onRecenter}
                    className="rounded-full shadow-lg bg-background hover:bg-accent text-foreground border border-border"
                    title="Recenter to my location"
                >
                    <MapPinIcon className="h-5 w-5" />
                </Button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-background p-3 rounded-lg shadow-lg z-10">
                <h4 className="font-semibold text-sm mb-2">Alert Severity</h4>
                <div className="space-y-1">
                    {(Object.entries(SEVERITY_COLORS) as [keyof typeof SEVERITY_COLORS, string][]).map(([severity, color]) => (
                        <div key={severity} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full border border-white"
                                style={{ backgroundColor: color }}
                            />
                            <span className="text-xs capitalize">{severity}</span>
                        </div>
                    ))}
                </div>
                {showUserLegend && (
                    <div className="border-t border-border mt-2 pt-2">
                        <div className="flex items-center gap-2">
                            <HomeIcon className="h-3 w-3 text-green-500" />
                            <span className="text-xs">Your Home</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-green-500/15" />
                            <span className="text-xs">Your Neighborhood</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Alert count */}
            <div className="absolute top-4 left-4 bg-background p-2 rounded-lg shadow-lg z-10">
                <div className="text-sm font-semibold">
                    {alertCount} Active Alert{alertCount !== 1 ? 's' : ''}
                </div>
            </div>
        </>
    );
};
