import { Image as ImageIcon } from "lucide-react";
import LookupPlaceholder from "@/assets/onboarding/lookup-placeholder.png";

interface MarketingPanelProps {
  eyebrow?: string;
  caption?: string;
}

const MarketingPanel = ({ eyebrow, caption }: MarketingPanelProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 h-full">
      <div className="relative w-full max-w-[280px] aspect-square rounded-3xl border-2 border-dashed border-foreground/[0.12] bg-foreground/[0.03] flex flex-col items-center justify-center overflow-hidden mb-5">
        <img
          src={LookupPlaceholder}
          alt="Marketing content placeholder"
          className="w-full h-full object-cover opacity-60"
          loading="lazy"
          width={1024}
          height={1024}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
          <ImageIcon className="w-8 h-8 text-foreground/40 mb-2" />
          <span className="text-[10px] uppercase tracking-widest text-foreground/40 font-semibold">
            {eyebrow ?? "Coming Soon"}
          </span>
        </div>
      </div>
      <h2 className="text-base font-bold text-foreground/80 mb-1.5">
        Marketing &amp; promotional content
      </h2>
      <p className="text-xs text-foreground/40 max-w-[20rem] leading-relaxed">
        {caption ??
          "This area will showcase brand imagery, welcome videos, and onboarding highlights to engage new users during setup."}
      </p>
    </div>
  );
};

export default MarketingPanel;
