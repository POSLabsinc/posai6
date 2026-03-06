import aiColorfulIcon from "@/assets/icons/ai-colorful.png";

interface AnimatedAIIconProps {
  onClick?: () => void;
  size?: number;
}

const AnimatedAIIcon = ({ onClick, size = 32 }: AnimatedAIIconProps) => {
  return (
    <div
      onClick={onClick}
      className="ai-icon-btn relative flex-shrink-0 active:opacity-80 cursor-pointer overflow-visible"
      style={{ width: size + 24, height: size + 24, minWidth: size + 24, minHeight: size + 24 }}
    >
      {/* Outer glow pulse ring */}
      <div
        className="absolute inset-0 rounded-full ai-pulse-outer"
        style={{
          background: "radial-gradient(circle, hsla(280, 80%, 60%, 0.4) 0%, hsla(220, 90%, 56%, 0.2) 50%, transparent 70%)",
        }}
      />

      {/* Secondary inner glow */}
      <div
        className="absolute inset-1 rounded-full ai-pulse-inner"
        style={{
          background: "radial-gradient(circle, hsla(25, 95%, 53%, 0.3) 0%, hsla(280, 80%, 60%, 0.15) 60%, transparent 80%)",
        }}
      />

      {/* Main icon */}
      <div className="absolute inset-0 flex items-center justify-center ai-icon-pulse">
        <img 
          src={aiColorfulIcon} 
          alt="AI Assistant" 
          style={{ width: size, height: size, filter: "drop-shadow(0 0 4px hsla(280, 80%, 60%, 0.3))" }}
          className="relative z-10"
        />
      </div>

      {/* Orbiting star 1 */}
      <div className="absolute ai-orbit-1" style={{ width: 6, height: 6, top: "50%", left: "50%", marginTop: -3, marginLeft: -3 }}>
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="url(#starGradient1)" />
          <defs>
            <linearGradient id="starGradient1" x1="4" y1="2" x2="20" y2="18">
              <stop stopColor="hsl(280, 80%, 70%)" />
              <stop offset="1" stopColor="hsl(220, 90%, 65%)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Orbiting star 2 */}
      <div className="absolute ai-orbit-2" style={{ width: 5, height: 5, top: "50%", left: "50%", marginTop: -2.5, marginLeft: -2.5 }}>
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="url(#starGradient2)" />
          <defs>
            <linearGradient id="starGradient2" x1="4" y1="2" x2="20" y2="18">
              <stop stopColor="hsl(25, 95%, 60%)" />
              <stop offset="1" stopColor="hsl(280, 80%, 65%)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Orbiting star 3 */}
      <div className="absolute ai-orbit-3" style={{ width: 4, height: 4, top: "50%", left: "50%", marginTop: -2, marginLeft: -2 }}>
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="url(#starGradient3)" />
          <defs>
            <linearGradient id="starGradient3" x1="4" y1="2" x2="20" y2="18">
              <stop stopColor="hsl(220, 90%, 70%)" />
              <stop offset="1" stopColor="hsl(25, 95%, 65%)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <style>{`
        .ai-icon-btn:hover { transform: scale(1.05); }
        .ai-icon-btn:active { transform: scale(0.95); }
        .ai-pulse-outer {
          animation: aiPulseOuter 2.5s ease-in-out infinite;
        }
        .ai-pulse-inner {
          animation: aiPulseInner 2s ease-in-out infinite 0.3s;
        }
        .ai-icon-pulse {
          animation: aiIconPulse 1.8s ease-in-out infinite;
        }
        .ai-orbit-1 {
          animation: aiOrbit1 4s linear infinite;
          pointer-events: none;
        }
        .ai-orbit-2 {
          animation: aiOrbit2 3.5s linear infinite 0.5s;
          pointer-events: none;
        }
        .ai-orbit-3 {
          animation: aiOrbit3 5s linear infinite 1s;
          pointer-events: none;
        }
        @keyframes aiPulseOuter {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 0.3; }
        }
        @keyframes aiPulseInner {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 0.4; }
        }
        @keyframes aiIconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes aiOrbit1 {
          0% { transform: translate(0px, -18px); opacity: 1; }
          25% { transform: translate(18px, 0px); opacity: 0.8; }
          50% { transform: translate(0px, 18px); opacity: 1; }
          75% { transform: translate(-18px, 0px); opacity: 0.8; }
          100% { transform: translate(0px, -18px); opacity: 1; }
        }
        @keyframes aiOrbit2 {
          0% { transform: translate(14px, 0px); opacity: 0.9; }
          25% { transform: translate(0px, 14px); opacity: 1; }
          50% { transform: translate(-14px, 0px); opacity: 0.9; }
          75% { transform: translate(0px, -14px); opacity: 1; }
          100% { transform: translate(14px, 0px); opacity: 0.9; }
        }
        @keyframes aiOrbit3 {
          0% { transform: translate(-12px, -12px); opacity: 0.8; }
          25% { transform: translate(-12px, 12px); opacity: 1; }
          50% { transform: translate(12px, 12px); opacity: 0.8; }
          75% { transform: translate(12px, -12px); opacity: 1; }
          100% { transform: translate(-12px, -12px); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default AnimatedAIIcon;
