import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  in: {
    opacity: 1,
    x: 0,
  },
  out: {
    opacity: 0,
    x: -20,
  },
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'anticipate' as const,
  duration: 0.3,
};

/**
 * PageTransition - Wrapper component for smooth page transitions
 * 
 * Usage:
 * ```tsx
 * import { PageTransition } from '@/components/PageTransition';
 * 
 * const MyPage = () => (
 *   <PageTransition>
 *     <div>Page content here</div>
 *   </PageTransition>
 * );
 * ```
 */
export const PageTransition = ({ children, className = '' }: PageTransitionProps) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * SlideTransition - Alternative slide-based transition for more dramatic effects
 */
export const SlideTransition = ({ children, className = '' }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * FadeTransition - Simple fade transition for minimal effect
 */
export const FadeTransition = ({ children, className = '' }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
