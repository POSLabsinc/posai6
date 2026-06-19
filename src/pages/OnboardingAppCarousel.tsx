import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  ShoppingBag,
  ChefHat,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  Flame,
  Utensils,
  Coffee,
  Pizza,
  Salad,
} from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";

type Slide = {
  eyebrow: string;
  headline: string;
  body: string;
};

const slides: Slide[] = [
  {
    eyebrow: "POSAI",
    headline: "The AI-first restaurant operating system",
    body: "One platform for your kiosk, Point of Sale, and kitchen display.",
  },
  {
    eyebrow: "POSAI Point of Sale",
    headline: "Meet your AI restaurant manager",
    body: "POSAI learns your menu, predicts demand, and helps your team serve faster.",
  },
  {
    eyebrow: "POSAI Point of Sale",
    headline: "Up and running in minutes",
    body: "Sign up, activate your device, and start taking orders today.",
  },
];

// Mock preview screens for the landscape carousel.
const PreviewFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-full max-w-[480px] aspect-[4/3] rounded-[28px] border border-foreground/[0.08] bg-foreground/[0.04] shadow-2xl overflow-hidden">
    {/* fake top bar */}
    <div className="flex items-center justify-between px-5 h-9 border-b border-foreground/[0.06] bg-foreground/[0.03]">
      <div className="flex gap-1.5">
        <span className="w-2 h-2 rounded-full bg-foreground/15" />
        <span className="w-2 h-2 rounded-full bg-foreground/15" />
        <span className="w-2 h-2 rounded-full bg-foreground/15" />
      </div>
      <span className="text-[10px] font-semibold tracking-wider text-foreground/40">POINT OF SALE</span>
      <span className="text-[10px] text-foreground/40">9:41</span>
    </div>
    <div className="p-4 h-[calc(100%-2.25rem)]">{children}</div>
  </div>
);

const PreviewOS = () => (
  <PreviewFrame>
    <div className="grid grid-cols-3 gap-3 h-full">
      {[
        { icon: ShoppingBag, label: "Point of Sale", tint: "bg-primary/20 text-primary" },
        { icon: ChefHat, label: "Kitchen", tint: "bg-amber-500/20 text-amber-500" },
        { icon: LayoutGrid, label: "Kiosk", tint: "bg-emerald-500/20 text-emerald-500" },
        { icon: TrendingUp, label: "Reports", tint: "bg-blue-500/20 text-blue-500" },
        { icon: Sparkles, label: "AI", tint: "bg-violet-500/20 text-violet-500" },
        { icon: Utensils, label: "Tables", tint: "bg-rose-500/20 text-rose-500" },
      ].map((t) => (
        <div
          key={t.label}
          className="rounded-2xl border border-foreground/[0.06] bg-foreground/[0.04] flex flex-col items-center justify-center gap-2 p-2"
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.tint}`}>
            <t.icon className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold text-foreground/70">{t.label}</span>
        </div>
      ))}
    </div>
  </PreviewFrame>
);

const PreviewAI = () => (
  <PreviewFrame>
    <div className="h-full flex flex-col gap-3">
      <div className="rounded-2xl border border-primary/30 bg-primary/[0.08] p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-primary" />
          </div>
          <span className="text-[11px] font-semibold text-foreground/80">AI Insight</span>
        </div>
        <p className="text-[10px] text-foreground/60 leading-relaxed">
          Friday dinner rush starts in 45 min. Prep 24 extra burger patties and assign 2 servers to patio.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.04] p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-[9px] text-foreground/50 uppercase tracking-wide">Sales</span>
          </div>
          <p className="text-sm font-bold text-foreground">$3,248</p>
          <p className="text-[9px] text-emerald-500">+12% vs yesterday</p>
        </div>
        <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.04] p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span className="text-[9px] text-foreground/50 uppercase tracking-wide">Avg Ticket</span>
          </div>
          <p className="text-sm font-bold text-foreground">7m 12s</p>
          <p className="text-[9px] text-foreground/40">Target 8m</p>
        </div>
      </div>
      <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.04] p-2.5 flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-foreground/70">Top Products</span>
          <span className="text-[9px] text-foreground/40">Today</span>
        </div>
        {[
          { icon: Pizza, name: "Margherita Pizza", n: 42 },
          { icon: Salad, name: "Caesar Salad", n: 31 },
          { icon: Coffee, name: "Cappuccino", n: 28 },
        ].map((p) => (
          <div key={p.name} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <p.icon className="w-3 h-3 text-foreground/50" />
              <span className="text-[10px] text-foreground/70">{p.name}</span>
            </div>
            <span className="text-[10px] font-semibold text-foreground/80">{p.n}</span>
          </div>
        ))}
      </div>
    </div>
  </PreviewFrame>
);

const PreviewOrders = () => (
  <PreviewFrame>
    <div className="h-full flex flex-col gap-2">
      {[
        { id: "#1042", table: "Table 7", status: "ORDERING", tint: "bg-amber-500/15 text-amber-500", time: "2m", icon: Flame },
        { id: "#1041", table: "Table 3", status: "ORDERED", tint: "bg-orange-500/15 text-orange-500", time: "8m", icon: Clock },
        { id: "#1040", table: "Bar 2", status: "PAID", tint: "bg-emerald-500/15 text-emerald-500", time: "12m", icon: CheckCircle2 },
        { id: "#1039", table: "Table 5", status: "PAID", tint: "bg-emerald-500/15 text-emerald-500", time: "18m", icon: CheckCircle2 },
      ].map((o) => (
        <div
          key={o.id}
          className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.04] p-2.5 flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${o.tint}`}>
              <o.icon className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-foreground">{o.id}</p>
              <p className="text-[9px] text-foreground/50">{o.table}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${o.tint}`}>{o.status}</span>
            <span className="text-[9px] text-foreground/40 w-6 text-right">{o.time}</span>
          </div>
        </div>
      ))}
    </div>
  </PreviewFrame>
);

const previews = [PreviewOS, PreviewAI, PreviewOrders];

const OnboardingAppCarousel = () => {
  const navigate = useNavigate();
  const isLandscape = useIsLandscape();
  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;

  const goNext = () => {
    if (isLast) {
      navigate("/onboarding/app/signup-signin");
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

  const textBlock = (
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
  );

  const dots = (
    <div className="flex items-center justify-center gap-2">
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
  );

  const skipBtn = (
    <button
      onClick={() => navigate("/onboarding/app/signup-signin")}
      className="h-12 min-h-[44px] rounded-2xl border border-foreground/[0.08] bg-transparent text-sm font-semibold text-foreground/70 hover:bg-foreground/[0.04] transition-all px-5"
    >
      Skip
    </button>
  );

  const nextBtn = (
    <button
      onClick={goNext}
      className={
        (isLast
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border border-foreground/[0.08] bg-foreground/[0.06] text-foreground hover:bg-foreground/[0.1]") +
        " h-12 min-h-[44px] rounded-2xl text-sm font-semibold transition-all px-5"
      }
    >
      {isLast ? "Get started" : "Next"}
    </button>
  );

  if (isLandscape) {
    return (
      <div className="fixed inset-0 login-bg overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />
        <div
          className="relative z-10 flex h-full w-full"
          style={{
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)",
          }}
        >
          {/* Left: animated app preview screens */}
          <div className="h-full flex flex-col justify-center items-center p-6" style={{ width: "50%" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full flex justify-center"
              >
                {(() => {
                  const Preview = previews[index] ?? previews[0];
                  return <Preview />;
                })()}
              </motion.div>
            </AnimatePresence>
          </div>
          {/* Right: content */}
          <div className="relative flex flex-col h-full" style={{ width: "50%", padding: "24px" }}>
            <button
              onClick={() => navigate("/onboarding/app/signup-signin")}
              className="absolute top-6 right-6 h-11 min-h-[44px] px-4 rounded-xl text-sm font-semibold text-foreground/70 hover:bg-foreground/[0.04] transition-all"
            >
              Skip
            </button>
            <div className="flex-1 flex flex-col justify-center">{textBlock}</div>
            <div className="flex flex-col gap-4">
              {dots}
              <div className="flex justify-end">
                {nextBtn}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 login-bg flex flex-col overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full max-w-md mx-auto w-full px-6 pt-6 pb-8">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={onDragEnd}
          className="rounded-3xl border border-foreground/[0.08] bg-foreground/[0.04] w-full"
          style={{ height: "45vh" }}
        />

        <div className="flex-1 flex flex-col justify-center mt-8">
          {textBlock}
          <div className="mt-8">{dots}</div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          {skipBtn}
          {nextBtn}
        </div>
      </div>
    </div>
  );
};

export default OnboardingAppCarousel;
