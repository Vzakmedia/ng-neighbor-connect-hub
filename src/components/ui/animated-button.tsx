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
          className="relative inline-block"
          initial="rest"
          whileHover="hover"
          animate="rest"
        >
          <motion.span 
            className="inline-flex items-center justify-center gap-2"
            variants={{
              rest: { y: 0 },
              hover: { y: "-100%" }
            }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.span>
          <motion.span 
            className="inline-flex items-center justify-center gap-2 absolute inset-0 top-full"
            variants={{
              rest: { y: 0 },
              hover: { y: "-100%" }
            }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.span>
        </motion.span>
      </Button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";
