import React from "react";
import { Star, Sparkles, Gift } from "lucide-react";

// Visual themes for voucher cards — shared between Single and Multi flows
export type CardTheme = {
  bg: string;
  border: string;
  glow: string;
  accent: string;
  accentText: string;
  badgeBg: string;
  badgeText: string;
  valueBg: string;
  subtitle: string;
  pattern: React.ReactNode;
};

export const CARD_THEMES: CardTheme[] = [
  // Elegant: dark + gold
  {
    bg: 'bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900',
    border: 'border-amber-900/40',
    glow: 'shadow-[0_0_20px_rgba(217,169,78,0.25)] border-amber-500/60 ring-1 ring-amber-400/30',
    accent: 'text-amber-400',
    accentText: 'text-amber-300',
    badgeBg: 'bg-amber-500/15 border-amber-500/30',
    badgeText: 'text-amber-300',
    valueBg: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent',
    subtitle: 'text-amber-500/70',
    pattern: (
      <>
        <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.04]" style={{ background: 'radial-gradient(circle at 70% 30%, #d4af37 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-20 h-20 opacity-[0.03]" style={{ background: 'radial-gradient(circle at 30% 70%, #d4af37 0%, transparent 70%)' }} />
        <div className="absolute top-3 right-3 opacity-[0.06]"><Star className="w-8 h-8 text-amber-400" /></div>
      </>
    ),
  },
  // Modern: gradient + bold
  {
    bg: 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900',
    border: 'border-blue-800/40',
    glow: 'shadow-[0_0_20px_rgba(96,165,250,0.25)] border-blue-400/60 ring-1 ring-blue-400/30',
    accent: 'text-blue-400',
    accentText: 'text-blue-300',
    badgeBg: 'bg-blue-500/15 border-blue-500/30',
    badgeText: 'text-blue-300',
    valueBg: 'bg-gradient-to-r from-blue-300 via-cyan-200 to-blue-300 bg-clip-text text-transparent',
    subtitle: 'text-blue-500/70',
    pattern: (
      <>
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 20px, rgba(96,165,250,0.3) 20px, rgba(96,165,250,0.3) 21px)' }} />
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #60a5fa 0%, transparent 70%)' }} />
      </>
    ),
  },
  // Festive: warm accent
  {
    bg: 'bg-gradient-to-br from-neutral-900 via-rose-950/30 to-neutral-900',
    border: 'border-rose-800/40',
    glow: 'shadow-[0_0_20px_rgba(244,114,182,0.25)] border-rose-400/60 ring-1 ring-rose-400/30',
    accent: 'text-rose-400',
    accentText: 'text-rose-300',
    badgeBg: 'bg-rose-500/15 border-rose-500/30',
    badgeText: 'text-rose-300',
    valueBg: 'bg-gradient-to-r from-rose-300 via-pink-200 to-rose-300 bg-clip-text text-transparent',
    subtitle: 'text-rose-500/70',
    pattern: (
      <>
        <div className="absolute top-0 right-0 w-full h-full opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(244,114,182,0.4) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(244,114,182,0.3) 0%, transparent 50%)' }} />
        <div className="absolute top-2 right-3 opacity-[0.08]"><Sparkles className="w-6 h-6 text-rose-400" /></div>
      </>
    ),
  },
  // Emerald luxury
  {
    bg: 'bg-gradient-to-br from-neutral-900 via-emerald-950/30 to-neutral-900',
    border: 'border-emerald-800/40',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.25)] border-emerald-400/60 ring-1 ring-emerald-400/30',
    accent: 'text-emerald-400',
    accentText: 'text-emerald-300',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
    badgeText: 'text-emerald-300',
    valueBg: 'bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent',
    subtitle: 'text-emerald-500/70',
    pattern: (
      <>
        <div className="absolute bottom-0 right-0 w-28 h-28 opacity-[0.04]" style={{ background: 'radial-gradient(circle at 80% 80%, #34d399 0%, transparent 60%)' }} />
        <div className="absolute top-2 left-3 opacity-[0.07]"><Gift className="w-5 h-5 text-emerald-400" /></div>
      </>
    ),
  },
  // Violet premium
  {
    bg: 'bg-gradient-to-br from-neutral-900 via-violet-950/30 to-neutral-900',
    border: 'border-violet-800/40',
    glow: 'shadow-[0_0_20px_rgba(167,139,250,0.25)] border-violet-400/60 ring-1 ring-violet-400/30',
    accent: 'text-violet-400',
    accentText: 'text-violet-300',
    badgeBg: 'bg-violet-500/15 border-violet-500/30',
    badgeText: 'text-violet-300',
    valueBg: 'bg-gradient-to-r from-violet-300 via-purple-200 to-violet-300 bg-clip-text text-transparent',
    subtitle: 'text-violet-500/70',
    pattern: (
      <>
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(167,139,250,0.2) 15px, rgba(167,139,250,0.2) 16px)' }} />
      </>
    ),
  },
];

export const getCardTheme = (index: number) => CARD_THEMES[index % CARD_THEMES.length];
