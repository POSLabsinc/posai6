import React from "react";
import { AbsoluteFill, Img, staticFile, interpolate, useCurrentFrame } from "remotion";

export const SW = 1440;
export const SH = 900;

type Drift = {
  from: { scale: number; x: number; y: number };
  to: { scale: number; x: number; y: number };
  duration: number;
};

export const Screen: React.FC<{
  src: string;
  overlaySrc?: string;
  overlayOpacity?: number;
  overlay2Src?: string;
  overlay2Opacity?: number;
  drift: Drift;
  glow?: number;
  children?: React.ReactNode;
}> = ({
  src,
  overlaySrc,
  overlayOpacity = 0,
  overlay2Src,
  overlay2Opacity = 0,
  drift,
  glow = 0,
  children,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, drift.duration], [0, 1], {
    extrapolateRight: "clamp",
    easing: (v) => v,
  });
  const scale = 1.16 * (drift.from.scale + (drift.to.scale - drift.from.scale) * t);
  const x = drift.from.x + (drift.to.x - drift.from.x) * t;
  const y = drift.from.y + (drift.to.y - drift.from.y) * t;

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(120% 90% at 50% 0%, #17171b 0%, #0b0b0d 55%, #060607 100%)",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: SW,
          height: SH,
          position: "relative",
          borderRadius: 26,
          overflow: "hidden",
          transform: `scale(${scale}) translate(${x}px, ${y}px)`,
          boxShadow: glow
            ? `0 40px 120px rgba(0,0,0,0.65), 0 0 ${60 * glow}px ${18 * glow}px rgba(120,110,255,${0.35 * glow})`
            : "0 40px 120px rgba(0,0,0,0.65)",
        }}
      >
        <Img src={staticFile(`images/${src}`)} style={{ width: SW, height: SH }} />
        {overlaySrc ? (
          <Img
            src={staticFile(`images/${overlaySrc}`)}
            style={{
              width: SW,
              height: SH,
              position: "absolute",
              inset: 0,
              opacity: overlayOpacity,
            }}
          />
        ) : null}
        {overlay2Src ? (
          <Img
            src={staticFile(`images/${overlay2Src}`)}
            style={{
              width: SW,
              height: SH,
              position: "absolute",
              inset: 0,
              opacity: overlay2Opacity,
            }}
          />
        ) : null}
        {children}
      </div>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "radial-gradient(75% 65% at 50% 50%, rgba(0,0,0,0) 68%, rgba(0,0,0,0.32) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
