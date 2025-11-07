import { motion } from "framer-motion";
import { MessageSquare, ShoppingBag, Calendar, MapPin, Shield, Users, Home, Bell } from "lucide-react";
import profile1 from "@/assets/profiles/profile-1.jpg";
import profile2 from "@/assets/profiles/profile-2.jpg";
import profile3 from "@/assets/profiles/profile-3.jpg";
import profile4 from "@/assets/profiles/profile-4.jpg";
import profile5 from "@/assets/profiles/profile-5.jpg";
import profile6 from "@/assets/profiles/profile-6.jpg";
import profile7 from "@/assets/profiles/profile-7.jpg";
import profile8 from "@/assets/profiles/profile-8.jpg";

const profiles = [
  { image: profile1, name: "Profile 1" },
  { image: profile2, name: "Profile 2" },
  { image: profile3, name: "Profile 3" },
  { image: profile4, name: "Profile 4" },
  { image: profile5, name: "Profile 5" },
  { image: profile6, name: "Profile 6" },
  { image: profile7, name: "Profile 7" },
  { image: profile8, name: "Profile 8" },
];

const integrationIcons = [
  { Icon: MessageSquare, label: "Messages" },
  { Icon: ShoppingBag, label: "Marketplace" },
  { Icon: Calendar, label: "Events" },
  { Icon: MapPin, label: "Location" },
  { Icon: Shield, label: "Safety" },
  { Icon: Users, label: "Community" },
  { Icon: Home, label: "Services" },
  { Icon: Bell, label: "Alerts" },
];

export const NetworkDiagram = () => {
  const radius = 280;
  const centerX = 400;
  const centerY = 300;

  return (
    <div className="relative w-full max-w-4xl mx-auto h-[600px] flex items-center justify-center">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Dashed connection lines from center to profiles */}
        {profiles.map((_, index) => {
          const angle = (index * 2 * Math.PI) / profiles.length - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);

          return (
            <motion.line
              key={`line-profile-${index}`}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="8 8"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
            />
          );
        })}

        {/* Dashed connection lines from center to integration icons */}
        {integrationIcons.map((_, index) => {
          const angle = (index * 2 * Math.PI) / integrationIcons.length;
          const iconRadius = 140;
          const x = centerX + iconRadius * Math.cos(angle);
          const y = centerY + iconRadius * Math.sin(angle);

          return (
            <motion.line
              key={`line-icon-${index}`}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.2 }}
              transition={{ duration: 0.8, delay: 0.5 + index * 0.05 }}
            />
          );
        })}
      </svg>

      {/* Central Hub */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <motion.div
          className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl border-4 border-white"
          animate={{
            boxShadow: [
              "0 0 20px rgba(162, 85, 30, 0.3)",
              "0 0 40px rgba(162, 85, 30, 0.5)",
              "0 0 20px rgba(162, 85, 30, 0.3)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-5xl font-bold text-white">N.</span>
        </motion.div>
      </motion.div>

      {/* Profile Circles */}
      {profiles.map((profile, index) => {
        const angle = (index * 2 * Math.PI) / profiles.length - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        return (
          <motion.div
            key={`profile-${index}`}
            className="absolute"
            style={{
              left: `${(x / 800) * 100}%`,
              top: `${(y / 600) * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
          >
            <motion.div
              className="relative"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            >
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-primary/30 shadow-lg bg-white">
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </motion.div>
        );
      })}

      {/* Integration Icons */}
      {integrationIcons.map((item, index) => {
        const angle = (index * 2 * Math.PI) / integrationIcons.length;
        const iconRadius = 140;
        const x = centerX + iconRadius * Math.cos(angle);
        const y = centerY + iconRadius * Math.sin(angle);

        return (
          <motion.div
            key={`icon-${index}`}
            className="absolute"
            style={{
              left: `${(x / 800) * 100}%`,
              top: `${(y / 600) * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 + index * 0.05 }}
          >
            <motion.div
              className="w-12 h-12 rounded-xl bg-white shadow-lg flex items-center justify-center border border-primary/20"
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: index * 0.15,
              }}
            >
              <item.Icon className="w-6 h-6 text-primary" />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
};
