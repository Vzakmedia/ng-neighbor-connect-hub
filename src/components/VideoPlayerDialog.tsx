import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface VideoPlayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  thumbnailUrl?: string | null;
  title?: string;
}

export const VideoPlayerDialog = ({
  isOpen,
  onClose,
  videoUrl,
  thumbnailUrl,
  title,
}: VideoPlayerDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 bg-black/95 border-border" aria-describedby="video-player-description">
        <VisuallyHidden>
          <DialogTitle>{title || "Video Player"}</DialogTitle>
          <div id="video-player-description">Fullscreen video player with playback controls</div>
        </VisuallyHidden>
        
        <div className="relative w-full h-full flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-50 bg-background/10 hover:bg-background/20 text-foreground rounded-full"
            aria-label="Close video player"
          >
            <X className="h-6 w-6" />
          </Button>
          
          {title && (
            <div className="absolute top-4 left-4 z-50 bg-background/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <p className="text-foreground font-medium">{title}</p>
            </div>
          )}

          <video
            src={videoUrl}
            poster={thumbnailUrl || undefined}
            controls
            autoPlay
            className="w-full h-full object-contain"
            style={{ maxHeight: "85vh" }}
            aria-label={title || "Video content"}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
