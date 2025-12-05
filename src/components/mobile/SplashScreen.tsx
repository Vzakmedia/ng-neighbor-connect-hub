import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Get timestamp for logging
 */
const getTimestamp = (): string => {
  return new Date().toISOString();
};

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const mountTimestamp = getTimestamp();
  console.log(`[SplashScreen ${mountTimestamp}] ========== COMPONENT MOUNTED ==========`);
  
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const timestamp = getTimestamp();
    console.log(`[SplashScreen ${timestamp}] Starting 3 second splash timer...`);
    
    const timer = setTimeout(() => {
      const completeTimestamp = getTimestamp();
      console.log(`[SplashScreen ${completeTimestamp}] Timer complete, setting animationComplete=true`);
      setAnimationComplete(true);
      
      console.log(`[SplashScreen ${completeTimestamp}] Starting 500ms exit animation delay...`);
      setTimeout(() => {
        const callbackTimestamp = getTimestamp();
        console.log(`[SplashScreen ${callbackTimestamp}] Exit animation complete, calling onComplete()`);
        onComplete();
      }, 500); // Small delay before transitioning
    }, 3000); // 3 seconds splash duration

    return () => {
      const cleanupTimestamp = getTimestamp();
      console.log(`[SplashScreen ${cleanupTimestamp}] Cleanup: clearing timer`);
      clearTimeout(timer);
    };
  }, [onComplete]);

  // Log animation state changes
  useEffect(() => {
    const timestamp = getTimestamp();
    console.log(`[SplashScreen ${timestamp}] Animation state changed: animationComplete=${animationComplete}`);
  }, [animationComplete]);

  const renderTimestamp = getTimestamp();
  console.log(`[SplashScreen ${renderTimestamp}] Rendering splash UI`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: animationComplete ? 0 : 1, 
          scale: animationComplete ? 1.2 : 1 
        }}
        transition={{ 
          duration: 0.8,
          ease: "easeInOut"
        }}
        className="flex flex-col items-center space-y-6"
      >
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            duration: 1.2,
            ease: "backOut",
            delay: 0.2
          }}
          className="relative"
        >
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
            <img 
              src="/lovable-uploads/9bca933b-29c0-4a99-894e-bc536d1a6a50.png" 
              alt="NeighborLink Logo" 
              className="w-16 h-16"
            />
          </div>
          
          {/* Pulse Animation */}
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-white/30 rounded-full"
          />
        </motion.div>

        {/* App Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8,
            delay: 1
          }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-white mb-2">NeighborLink</h1>
          <p className="text-white/80 text-lg">Connecting Communities</p>
        </motion.div>

        {/* Loading Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex space-x-1"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-2 h-2 bg-white rounded-full"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
