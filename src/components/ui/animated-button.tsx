import * as React from "react";
import { Button, ButtonProps } from "./button";
import { motion } from "framer-motion";

interface AnimatedButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <Button 
        ref={ref}
        {...props} 
        className={`overflow-hidden relative ${className || ''}`}
      >
        <motion.div 
          className="relative flex items-center justify-center"
          initial={{ y: 0 }}
          whileHover={{ y: -30 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* First text (visible initially) */}
          <span className="flex items-center justify-center gap-2">{children}</span>
          {/* Second text (slides up from below) */}
          <span className="flex items-center justify-center gap-2 absolute top-full left-0 w-full">{children}</span>
        </motion.div>
      </Button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";
