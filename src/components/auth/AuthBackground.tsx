import { 
  MessageSquare, 
  MessageCircle,
  Mail,
  Phone,
  Video,
  Send,
  Mic,
  Users,
  Heart,
  Smile
} from 'lucide-react';

const AuthBackground = () => {
  // WhatsApp-style chat bubble pattern
  const chatIcons = [
    MessageSquare, MessageCircle, Mail, Phone, Video, 
    Send, Mic, Users, Heart, Smile
  ];

  // Create a structured grid pattern like WhatsApp
  const generateGridPattern = () => {
    const patterns = [];
    const gridSize = 8; // 8x8 grid
    const iconSize = ['w-4 h-4', 'w-5 h-5', 'w-6 h-6', 'w-7 h-7'];
    const opacities = ['opacity-10', 'opacity-15', 'opacity-20', 'opacity-25'];
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Skip some positions to create WhatsApp-like spacing
        if ((row + col) % 3 === 0 || (row * col) % 4 === 0) {
          const IconComponent = chatIcons[Math.floor(Math.random() * chatIcons.length)];
          const size = iconSize[Math.floor(Math.random() * iconSize.length)];
          const opacity = opacities[Math.floor(Math.random() * opacities.length)];
          const rotation = Math.floor(Math.random() * 4) * 90; // 0, 90, 180, 270 degrees
          
          patterns.push({
            Icon: IconComponent,
            x: (col / gridSize) * 100,
            y: (row / gridSize) * 100,
            size,
            opacity,
            rotation,
            key: `${row}-${col}`
          });
        }
      }
    }
    return patterns;
  };

  const iconPattern = generateGridPattern();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* WhatsApp-style pattern background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 via-green-100/20 to-green-200/30" />
      
      {/* Chat bubble pattern icons */}
      {iconPattern.map((item) => {
        const IconComponent = item.Icon;
        return (
          <div
            key={item.key}
            className={`absolute text-green-600 ${item.size} ${item.opacity}`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: `rotate(${item.rotation}deg)`,
            }}
          >
            <IconComponent className="w-full h-full" />
          </div>
        );
      })}

      {/* Additional large chat bubbles for WhatsApp feel */}
      <div className="absolute top-10 left-10 text-green-500/20">
        <MessageCircle className="w-16 h-16" />
      </div>
      <div className="absolute top-20 right-16 text-green-600/15">
        <MessageSquare className="w-12 h-12 rotate-12" />
      </div>
      <div className="absolute bottom-16 left-20 text-green-500/25">
        <Send className="w-10 h-10 -rotate-12" />
      </div>
      <div className="absolute bottom-20 right-12 text-green-600/20">
        <Users className="w-14 h-14 rotate-45" />
      </div>
      <div className="absolute top-1/2 left-1/4 text-green-500/10">
        <Phone className="w-8 h-8 rotate-90" />
      </div>
      <div className="absolute top-1/3 right-1/3 text-green-600/15">
        <Video className="w-9 h-9 -rotate-45" />
      </div>

      {/* WhatsApp-style dots pattern */}
      {Array.from({ length: 20 }).map((_, index) => (
        <div
          key={`dot-${index}`}
          className="absolute w-1 h-1 bg-green-500/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}

      {/* Subtle overlay to ensure readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-background/30 to-background/60" />
    </div>
  );
};

export default AuthBackground;