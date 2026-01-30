import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import logoImage from '@/assets/neighborlink-logo.png';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [animationComplete, setAnimationComplete] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
      setTimeout(() => {
        onCompleteRef.current();
      }, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);


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
          <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
            <img
              src={logoImage}
              alt="NeighborLink Logo"
              className="w-20 h-20 rounded-xl"
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
