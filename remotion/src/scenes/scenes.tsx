import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Screen } from "../components/Screen";
import { Touch } from "../components/Touch";

const fadeIn = (frame: number, start: number, len = 16) =>
  interpolate(frame, [start, start + len], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const D_LOGIN = 210;
export const D_SELECT = 210;
export const D_MODS = 240;
export const D_PAY = 240;
export const D_SETTINGS = 210;
export const D_MAYA = 270;

export const SceneLogin: React.FC = () => (
  <Screen
    src="01_login_signin.png"
    drift={{ from: { scale: 1.02, x: 0, y: 8 }, to: { scale: 1.09, x: -14, y: -6 }, duration: D_LOGIN }}
  />
);

export const SceneSelect: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Screen
      src="02_orders_before.png"
      overlaySrc="03_mod_open.png"
      overlayOpacity={fadeIn(frame, 96, 14)}
      drift={{ from: { scale: 1.12, x: 120, y: 60 }, to: { scale: 1.04, x: 30, y: 10 }, duration: D_SELECT }}
    >
      <Touch x={154} y={206} at={70} />
    </Screen>
  );
};

export const SceneMods: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Screen
      src="03_mod_open.png"
      overlaySrc="03_mod_1.png"
      overlayOpacity={fadeIn(frame, 58, 12)}
      overlay2Src="03_mod_2.png"
      overlay2Opacity={fadeIn(frame, 128, 12)}
      drift={{ from: { scale: 1.05, x: 0, y: -20 }, to: { scale: 1.14, x: 0, y: -46 }, duration: D_MODS }}
    >
      <Touch x={636} y={523} at={44} />
      <Touch x={689} y={600} at={114} />
    </Screen>
  );
};

export const ScenePayment: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Screen
      src="05_payment.png"
      overlaySrc="05b_card.png"
      overlayOpacity={fadeIn(frame, 82, 14)}
      drift={{ from: { scale: 1.06, x: -20, y: 20 }, to: { scale: 1.15, x: -46, y: 34 }, duration: D_PAY }}
    >
      <Touch x={452} y={347} at={62} />
    </Screen>
  );
};

export const SceneSettings: React.FC = () => (
  <Screen
    src="06_settings.png"
    drift={{ from: { scale: 1.14, x: 150, y: 130 }, to: { scale: 1.02, x: -20, y: 0 }, duration: D_SETTINGS }}
  />
);

export const SceneMaya: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = interpolate(frame, [96, 130, 230, 260], [0, 1, 1, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Screen
      src="07_maya_before.png"
      overlaySrc="08_ai_assistant.png"
      overlayOpacity={fadeIn(frame, 96, 18)}
      glow={glow}
      drift={{ from: { scale: 1.04, x: 0, y: 0 }, to: { scale: 1.12, x: -120, y: -10 }, duration: D_MAYA }}
    >
      <Touch x={442} y={373} at={64} />
    </Screen>
  );
};
