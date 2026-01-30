import { Loader2 } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner = ({ className, size = "md", text, fullScreen = false }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative flex flex-col items-center gap-4">
          <div className="relative h-24 w-24 animate-pulse">
            <img
              src="/neighborlink-logo.png"
              alt="Loading..."
              className="h-full w-full object-contain"
            />
          </div>
          {text && (
            <p className="text-lg font-medium text-foreground/80 animate-pulse delay-75">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-[hsl(162,85%,30%)]", sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md)} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
};