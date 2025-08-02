import { 
  MessageSquare, 
  MessageCircle,
  Mail,
  Phone,
  Video,
  Send,
  Users,
  Heart,
  Smile,
  Star,
  AtSign,
  Hash,
  Bell,
  Calendar,
  Clock,
  Globe,
  Zap,
  Wifi,
  Share2,
  ThumbsUp
} from 'lucide-react';

const AuthBackground = () => {
  // Communication and social icons for the pattern
  const icons = [
    MessageSquare, MessageCircle, Mail, Phone, Video, Send,
    Users, Heart, Smile, Star, AtSign, Hash, Bell, Calendar,
    Clock, Globe, Zap, Wifi, Share2, ThumbsUp
  ];

  // Create a seamless repeating pattern like the reference image
  const createPattern = () => {
    const pattern = [];
    const rows = 12;
    const cols = 16;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Create varied spacing like the reference
        if ((row + col) % 3 === 0 || (row * 2 + col) % 5 === 0) {
          const IconComponent = icons[Math.floor(Math.random() * icons.length)];
          const size = Math.random() > 0.7 ? 'w-5 h-5' : 'w-4 h-4';
          const opacity = Math.random() > 0.5 ? 'opacity-20' : 'opacity-15';
          
          pattern.push({
            Icon: IconComponent,
            x: (col / cols) * 100,
            y: (row / rows) * 100,
            size,
            opacity,
            key: `icon-${row}-${col}`,
            rotation: Math.floor(Math.random() * 4) * 15 // Subtle rotations
          });
        }
        
        // Add small decorative elements like in the reference
        if ((row + col) % 7 === 0) {
          pattern.push({
            Icon: null,
            x: (col / cols) * 100,
            y: (row / rows) * 100,
            size: 'w-1 h-1',
            opacity: 'opacity-30',
            key: `dot-${row}-${col}`,
            rotation: 0,
            isDot: true
          });
        }
        
        // Add small squares like in the reference
        if ((row * 3 + col) % 11 === 0) {
          pattern.push({
            Icon: null,
            x: (col / cols) * 100,
            y: (row / rows) * 100,
            size: 'w-1.5 h-1.5',
            opacity: 'opacity-25',
            key: `square-${row}-${col}`,
            rotation: 45,
            isSquare: true
          });
        }
      }
    }
    return pattern;
  };

  const patternElements = createPattern();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-white">
      {/* Main pattern elements */}
      {patternElements.map((element) => {
        if (element.isDot) {
          return (
            <div
              key={element.key}
              className={`absolute bg-green-500 ${element.size} ${element.opacity} rounded-full`}
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
              }}
            />
          );
        }
        
        if (element.isSquare) {
          return (
            <div
              key={element.key}
              className={`absolute bg-green-500 ${element.size} ${element.opacity}`}
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                transform: `rotate(${element.rotation}deg)`,
              }}
            />
          );
        }

        const IconComponent = element.Icon;
        return (
          <div
            key={element.key}
            className={`absolute text-green-500 ${element.size} ${element.opacity}`}
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              transform: `rotate(${element.rotation}deg)`,
            }}
          >
            <IconComponent className="w-full h-full" strokeWidth={1.5} />
          </div>
        );
      })}

      {/* Subtle overlay to ensure form readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/50 to-white/70" />
    </div>
  );
};

export default AuthBackground;