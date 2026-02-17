import { useState } from "react";
import { motion } from "framer-motion";
import aiColorfulIcon from "@/assets/icons/ai-colorful.png";

interface AnimatedAIIconProps {
  onClick?: () => void;
  size?: number;
}

const AnimatedAIIcon = ({ onClick, size = 32 }: AnimatedAIIconProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex-shrink-0 active:opacity-80 cursor-pointer overflow-visible"
      style={{ width: size + 24, height: size + 24, minWidth: size + 24, minHeight: size + 24 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* Outer glow pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, hsla(280, 80%, 60%, 0.4) 0%, hsla(220, 90%, 56%, 0.2) 50%, transparent 70%)",
        }}
        animate={{
          scale: isHovered ? [1.2, 1.5, 1.2] : [1, 1.3, 1],
          opacity: isHovered ? [0.9, 0.5, 0.9] : [0.6, 0.3, 0.6],
        }}
        transition={{
          duration: isHovered ? 1.5 : 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary inner glow - intensifies on hover */}
      <motion.div
        className="absolute inset-1 rounded-full"
        style={{
          background: isHovered 
            ? "radial-gradient(circle, hsla(25, 95%, 53%, 0.5) 0%, hsla(280, 80%, 60%, 0.3) 60%, transparent 80%)"
            : "radial-gradient(circle, hsla(25, 95%, 53%, 0.3) 0%, hsla(280, 80%, 60%, 0.15) 60%, transparent 80%)",
        }}
        animate={{
          scale: isHovered ? [1.1, 1.25, 1.1] : [1, 1.15, 1],
          opacity: isHovered ? [1, 0.7, 1] : [0.7, 0.4, 0.7],
        }}
        transition={{
          duration: isHovered ? 1.2 : 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
      />

      {/* Hover highlight ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, hsla(0, 0%, 100%, 0.15) 0%, transparent 60%)",
          boxShadow: isHovered ? "0 0 20px hsla(280, 80%, 60%, 0.5), 0 0 40px hsla(220, 90%, 56%, 0.3)" : "none",
        }}
        animate={{
          opacity: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Main icon container with subtle pulse */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: isHovered ? [1.05, 1.08, 1.05] : [1, 1.02, 1],
        }}
        transition={{
          duration: isHovered ? 1 : 1.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <motion.img 
          src={aiColorfulIcon} 
          alt="AI Assistant" 
          style={{ width: size, height: size }}
          className="relative z-10"
          animate={{
            filter: isHovered 
              ? "drop-shadow(0 0 8px hsla(280, 80%, 60%, 0.6)) drop-shadow(0 0 16px hsla(25, 95%, 53%, 0.4))"
              : "drop-shadow(0 0 4px hsla(280, 80%, 60%, 0.3))",
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      {/* Orbiting star 1 */}
      <motion.div
        className="absolute"
        style={{
          width: 6,
          height: 6,
          top: "50%",
          left: "50%",
          marginTop: -3,
          marginLeft: -3,
        }}
        animate={{
          x: [0, 18, 0, -18, 0],
          y: [-18, 0, 18, 0, -18],
          opacity: [1, 0.8, 1, 0.8, 1],
          scale: [1, 0.8, 1, 0.8, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <path
            d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
            fill="url(#starGradient1)"
          />
          <defs>
            <linearGradient id="starGradient1" x1="4" y1="2" x2="20" y2="18">
              <stop stopColor="hsl(280, 80%, 70%)" />
              <stop offset="1" stopColor="hsl(220, 90%, 65%)" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Orbiting star 2 */}
      <motion.div
        className="absolute"
        style={{
          width: 5,
          height: 5,
          top: "50%",
          left: "50%",
          marginTop: -2.5,
          marginLeft: -2.5,
        }}
        animate={{
          x: [14, 0, -14, 0, 14],
          y: [0, 14, 0, -14, 0],
          opacity: [0.9, 1, 0.9, 1, 0.9],
          scale: [0.9, 1, 0.9, 1, 0.9],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "linear",
          delay: 0.5,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <path
            d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
            fill="url(#starGradient2)"
          />
          <defs>
            <linearGradient id="starGradient2" x1="4" y1="2" x2="20" y2="18">
              <stop stopColor="hsl(25, 95%, 60%)" />
              <stop offset="1" stopColor="hsl(280, 80%, 65%)" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Orbiting star 3 (smaller, faster) */}
      <motion.div
        className="absolute"
        style={{
          width: 4,
          height: 4,
          top: "50%",
          left: "50%",
          marginTop: -2,
          marginLeft: -2,
        }}
        animate={{
          x: [-12, -12, 12, 12, -12],
          y: [-12, 12, 12, -12, -12],
          opacity: [0.8, 1, 0.8, 1, 0.8],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "linear",
          delay: 1,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <path
            d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
            fill="url(#starGradient3)"
          />
          <defs>
            <linearGradient id="starGradient3" x1="4" y1="2" x2="20" y2="18">
              <stop stopColor="hsl(220, 90%, 70%)" />
              <stop offset="1" stopColor="hsl(25, 95%, 65%)" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </motion.button>
  );
};

export default AnimatedAIIcon;
