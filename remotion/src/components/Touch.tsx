import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const Touch: React.FC<{ x: number; y: number; at: number }> = ({ x, y, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - at;
  if (local < -18 || local > 40) return null;

  const approach = spring({ frame: local + 18, fps, config: { damping: 18, stiffness: 130 } });
  const press = interpolate(local, [0, 5, 14], [1, 0.72, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(local, [-18, -12, 26, 38], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dotScale = approach * press;

  const ripple = local >= 0 ? interpolate(local, [0, 26], [0.2, 3.4], { extrapolateRight: "clamp" }) : 0;
  const rippleOpacity = local >= 0 ? interpolate(local, [0, 26], [0.55, 0], { extrapolateRight: "clamp" }) : 0;

  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: fade }}>
      {ripple > 0 ? (
        <div
          style={{
            position: "absolute",
            width: 62,
            height: 62,
            marginLeft: -31,
            marginTop: -31,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.75)",
            transform: `scale(${ripple})`,
            opacity: rippleOpacity,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          width: 62,
          height: 62,
          marginLeft: -31,
          marginTop: -31,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0.08) 70%)",
          boxShadow: "0 0 26px rgba(255,255,255,0.35)",
          transform: `scale(${dotScale})`,
        }}
      />
    </div>
  );
};
