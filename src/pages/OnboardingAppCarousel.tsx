import { useState, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useNavigate } from "react-router-dom";

type Slide = {
  eyebrow: string;
  headline: string;
  body: string;
};

const slides: Slide[] = [
  {
    eyebrow: "POSAI",
    headline: "The AI-first restaurant operating system",
    body: "One platform for your kiosk, POS, and kitchen display.",
  },
  {
    eyebrow: "POSAI POS",
    headline: "Meet your AI restaurant manager",
    body: "POSAI learns your menu, predicts demand, and helps your team serve faster.",
  },
  {
    eyebrow: "POSAI POS",
    headline: "Up and running in minutes",
    body: "Sign up, activate your device, and start taking orders today.",
  },
];

const OnboardingAppCarousel = () => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;

  const goNext = () => {
    if (isLast) {
      navigate("/onboarding/app/signup");
    } else {
      setIndex((i) => Math.min(i + 1, slides.length - 1));
    }
  };

  const goPrev = () => {
    if (index === 0) {
      navigate("/onboarding");
    } else {
      setIndex((i) => Math.max(i - 1, 0));
    }
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold) goNext();
    else if (info.offset.x > threshold) goPrev();
  };

  const slide = slides[index];

  return (
    <div className="fixed inset-0 login-bg flex flex-col overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full max-w-md mx-auto w-full px-6 pt-6 pb-8">
        {/* Image placeholder — ~45% of viewport */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={onDragEnd}
          className="rounded-3xl border border-foreground/[0.08] bg-foreground/[0.04] w-full"
          style={{ height: "45vh" }}
        />

        {/* Text block */}
        <div className="flex-1 flex flex-col justify-center mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="text-center"
            >
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-primary mb-3">
                {slide.eyebrow}
              </p>
              <h1 className="text-2xl font-bold text-foreground mb-3 leading-tight">
                {slide.headline}
              </h1>
              <p className="text-sm text-foreground/60 leading-relaxed">
                {slide.body}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {slides.map((_, i) => {
              const active = i === index;
              const done = i < index;
              return (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    active
                      ? "w-6 bg-primary"
                      : done
                      ? "w-1.5 bg-foreground/30"
                      : "w-1.5 bg-foreground/[0.12]"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={() => navigate("/onboarding/app/signup")}
            className="h-12 rounded-2xl border border-foreground/[0.08] bg-transparent text-sm font-semibold text-foreground/70 hover:bg-foreground/[0.04] transition-all"
          >
            Skip
          </button>
          <button
            onClick={goNext}
            className={
              isLast
                ? "h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
                : "h-12 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.06] text-sm font-semibold text-foreground hover:bg-foreground/[0.1] transition-all"
            }
          >
            {isLast ? "Get started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingAppCarousel;
