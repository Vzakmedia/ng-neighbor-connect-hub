import { motion } from 'framer-motion';
import { 
  Users, 
  Shield, 
  MessageSquare, 
  Home, 
  Calendar, 
  ShoppingBag, 
  Heart,
  MapPin,
  Bell,
  UserCheck,
  Lock,
  Wifi
} from 'lucide-react';

const AuthBackground = () => {
  // Array of app-related icons with different sizes and animation properties
  const iconData = [
    { Icon: Users, size: 'w-6 h-6', delay: 0, pulse: true },
    { Icon: Shield, size: 'w-5 h-5', delay: 0.5, pulse: false },
    { Icon: MessageSquare, size: 'w-7 h-7', delay: 1, pulse: true },
    { Icon: Home, size: 'w-6 h-6', delay: 1.5, pulse: false },
    { Icon: Calendar, size: 'w-5 h-5', delay: 2, pulse: true },
    { Icon: ShoppingBag, size: 'w-6 h-6', delay: 2.5, pulse: false },
    { Icon: Heart, size: 'w-4 h-4', delay: 3, pulse: true },
    { Icon: MapPin, size: 'w-5 h-5', delay: 3.5, pulse: false },
    { Icon: Bell, size: 'w-6 h-6', delay: 4, pulse: true },
    { Icon: UserCheck, size: 'w-5 h-5', delay: 4.5, pulse: false },
    { Icon: Lock, size: 'w-4 h-4', delay: 5, pulse: true },
    { Icon: Wifi, size: 'w-6 h-6', delay: 5.5, pulse: false },
  ];

  // Generate random positions for icons
  const generateRandomPosition = () => ({
    x: Math.random() * 90, // 0-90% of screen width
    y: Math.random() * 90, // 0-90% of screen height
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Generate multiple sets of icons for a rich pattern */}
      {Array.from({ length: 3 }).map((_, setIndex) => (
        iconData.map((iconInfo, index) => {
          const position = generateRandomPosition();
          const IconComponent = iconInfo.Icon;
          const uniqueKey = `${setIndex}-${index}`;
          
          return (
            <motion.div
              key={uniqueKey}
              className={`absolute text-primary/60 ${iconInfo.size}`}
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
              }}
              initial={{ 
                opacity: 0, 
                scale: 0,
                rotate: 0
              }}
              animate={{ 
                opacity: [0.3, 1, 0.6, 1],
                scale: iconInfo.pulse ? [1, 1.2, 1, 1.1, 1] : [1, 1.05, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: iconInfo.pulse ? 4 : 6,
                delay: iconInfo.delay + (setIndex * 0.5),
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <IconComponent className="w-full h-full" />
            </motion.div>
          );
        })
      ))}
      
      {/* Floating orbs for additional visual interest */}
      {Array.from({ length: 8 }).map((_, index) => {
        const position = generateRandomPosition();
        return (
          <motion.div
            key={`orb-${index}`}
            className="absolute rounded-full bg-primary/40"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              width: Math.random() * 20 + 10, // 10-30px
              height: Math.random() * 20 + 10,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2, // 3-5 seconds
              delay: index * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Very light gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-muted/10" />
    </div>
  );
};

export default AuthBackground;