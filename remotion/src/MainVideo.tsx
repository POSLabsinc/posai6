import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import {
  SceneLogin,
  SceneSelect,
  SceneMods,
  ScenePayment,
  SceneSettings,
  SceneMaya,
  D_LOGIN,
  D_SELECT,
  D_MODS,
  D_PAY,
  D_SETTINGS,
  D_MAYA,
} from "./scenes/scenes";

const T = 18;
export const TOTAL_FRAMES =
  D_LOGIN + D_SELECT + D_MODS + D_PAY + D_SETTINGS + D_MAYA - 5 * T;

const push = slide({ direction: "from-right" });
const pushTiming = springTiming({ config: { damping: 200 }, durationInFrames: T });
const fadeTiming = linearTiming({ durationInFrames: T });

export const MainVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#060607" }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={D_LOGIN}>
        <SceneLogin />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={push} timing={pushTiming} />
      <TransitionSeries.Sequence durationInFrames={D_SELECT}>
        <SceneSelect />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence durationInFrames={D_MODS}>
        <SceneMods />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={push} timing={pushTiming} />
      <TransitionSeries.Sequence durationInFrames={D_PAY}>
        <ScenePayment />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={push} timing={pushTiming} />
      <TransitionSeries.Sequence durationInFrames={D_SETTINGS}>
        <SceneSettings />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence durationInFrames={D_MAYA}>
        <SceneMaya />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
