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
        className={`overflow-hidden ${className || ''}`}
      >
        <motion.span 
          className="inline-flex items-center justify-center gap-2"
          initial={{ y: 0 }}
          whileHover={{ y: "-100%" }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <span className="inline-flex items-center justify-center gap-2">{children}</span>
          <span className="inline-flex items-center justify-center gap-2 absolute top-full left-1/2 -translate-x-1/2 w-full">{children}</span>
        </motion.span>
      </Button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";
