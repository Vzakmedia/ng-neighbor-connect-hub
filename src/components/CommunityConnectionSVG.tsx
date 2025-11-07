import { motion } from 'framer-motion';

const CommunityConnectionSVG = () => {
  // Profile circle data - positions and colors
  const profiles = [
    { id: 1, cx: 200, cy: 100, color: 'hsl(var(--primary))' },
    { id: 2, cx: 400, cy: 80, color: 'hsl(var(--secondary))' },
    { id: 3, cx: 600, cy: 120, color: 'hsl(var(--primary))' },
    { id: 4, cx: 100, cy: 250, color: 'hsl(var(--secondary))' },
    { id: 5, cx: 350, cy: 280, color: 'hsl(var(--primary))' },
    { id: 6, cx: 550, cy: 260, color: 'hsl(var(--secondary))' },
    { id: 7, cx: 700, cy: 240, color: 'hsl(var(--primary))' },
  ];

  // Connecting lines between profiles
  const connections = [
    { from: profiles[0], to: profiles[1] },
    { from: profiles[1], to: profiles[2] },
    { from: profiles[0], to: profiles[3] },
    { from: profiles[1], to: profiles[4] },
    { from: profiles[2], to: profiles[5] },
    { from: profiles[3], to: profiles[4] },
    { from: profiles[4], to: profiles[5] },
    { from: profiles[5], to: profiles[6] },
    { from: profiles[2], to: profiles[6] },
  ];

  return (
    <svg 
      viewBox="0 0 800 400" 
      className="w-full max-w-4xl mx-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Gradient for lines */}
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
        </linearGradient>

        {/* Glow filter */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Connecting Lines */}
      <g className="connections">
        {connections.map((conn, index) => (
          <motion.line
            key={`line-${index}`}
            x1={conn.from.cx}
            y1={conn.from.cy}
            x2={conn.to.cx}
            y2={conn.to.cy}
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 1,
              delay: index * 0.15,
              ease: "easeInOut"
            }}
          />
        ))}
      </g>

      {/* Animated pulse rings */}
      {profiles.map((profile, index) => (
        <motion.circle
          key={`pulse-${profile.id}`}
          cx={profile.cx}
          cy={profile.cy}
          r="40"
          fill="none"
          stroke={profile.color}
          strokeWidth="2"
          opacity="0.3"
          initial={{ r: 40, opacity: 0 }}
          animate={{ 
            r: [40, 60, 40],
            opacity: [0, 0.3, 0]
          }}
          transition={{
            duration: 2,
            delay: index * 0.2,
            repeat: Infinity,
            repeatDelay: 1
          }}
        />
      ))}

      {/* Profile Circles */}
      {profiles.map((profile, index) => (
        <g key={`profile-${profile.id}`}>
          {/* Outer glow circle */}
          <motion.circle
            cx={profile.cx}
            cy={profile.cy}
            r="35"
            fill={profile.color}
            opacity="0.1"
            filter="url(#glow)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.1 }}
            transition={{
              duration: 0.6,
              delay: 0.5 + index * 0.1,
              type: "spring",
              stiffness: 200
            }}
          />
          
          {/* Main profile circle */}
          <motion.circle
            cx={profile.cx}
            cy={profile.cy}
            r="30"
            fill={profile.color}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.2 }}
            transition={{
              duration: 0.5,
              delay: 0.5 + index * 0.1,
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
            style={{ cursor: 'pointer' }}
          />
          
          {/* Inner highlight circle */}
          <motion.circle
            cx={profile.cx - 8}
            cy={profile.cy - 8}
            r="8"
            fill="white"
            opacity="0.4"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{
              duration: 0.5,
              delay: 0.6 + index * 0.1
            }}
          />
        </g>
      ))}

      {/* Connection points (small dots at intersections) */}
      {connections.map((conn, index) => {
        const midX = (conn.from.cx + conn.to.cx) / 2;
        const midY = (conn.from.cy + conn.to.cy) / 2;
        
        return (
          <motion.circle
            key={`dot-${index}`}
            cx={midX}
            cy={midY}
            r="4"
            fill="hsl(var(--primary))"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1, 1],
              opacity: [0, 1, 0.6]
            }}
            transition={{
              duration: 0.8,
              delay: 1 + index * 0.15
            }}
          />
        );
      })}
    </svg>
  );
};

export default CommunityConnectionSVG;
