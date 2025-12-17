import { useState, useEffect } from 'react';
import { 
  Palette,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Type,
  Layout,
  Sparkles,
  Sliders,
  Download,
  Upload,
  Copy
} from 'lucide-react';
import { useTheme, useCustomThemes } from '@/contexts/ThemeContext';
import { Theme, ThemeColors } from '@/lib/theme-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

// HSL color picker component
function HSLColorPicker({ 
  label, 
  value, 
  onChange,
  description
}: { 
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}) {
  // Parse HSL value: "h s% l%" or "h s% l% / a"
  const parseHSL = (hsl: string) => {
    const parts = hsl.split(/[\s/]+/).filter(Boolean);
    return {
      h: parseFloat(parts[0]) || 0,
      s: parseFloat(parts[1]) || 0,
      l: parseFloat(parts[2]) || 0,
      a: parts[3] ? parseFloat(parts[3]) : 1,
    };
  };
  
  const { h, s, l, a } = parseHSL(value);
  const hasAlpha = value.includes('/');
  
  const updateValue = (newH: number, newS: number, newL: number, newA: number) => {
    if (hasAlpha || newA < 1) {
      onChange(`${Math.round(newH)} ${Math.round(newS)}% ${Math.round(newL)}% / ${newA}`);
    } else {
      onChange(`${Math.round(newH)} ${Math.round(newS)}% ${Math.round(newL)}%`);
    }
  };
  
  // Convert to hex for the color input
  const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = (x: number) => {
      const hex = Math.round(255 * x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  };
  
  // Convert from hex to HSL
  const hexToHSL = (hex: string): { h: number; s: number; l: number } => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return { h: h * 360, s: s * 100, l: l * 100 };
  };
  
  const hexValue = hslToHex(h, s, l);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={hexValue}
            onChange={(e) => {
              const { h: newH, s: newS, l: newL } = hexToHSL(e.target.value);
              updateValue(newH, newS, newL, a);
            }}
            className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
          />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-32 h-8 text-xs font-mono"
          />
        </div>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-4">H</span>
          <Slider
            value={[h]}
            max={360}
            step={1}
            onValueChange={([newH]) => updateValue(newH, s, l, a)}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-8">{Math.round(h)}°</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-4">S</span>
          <Slider
            value={[s]}
            max={100}
            step={1}
            onValueChange={([newS]) => updateValue(h, newS, l, a)}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-8">{Math.round(s)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-4">L</span>
          <Slider
            value={[l]}
            max={100}
            step={1}
            onValueChange={([newL]) => updateValue(h, s, newL, a)}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-8">{Math.round(l)}%</span>
        </div>
        {hasAlpha && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-4">A</span>
            <Slider
              value={[a * 100]}
              max={100}
              step={1}
              onValueChange={([newA]) => updateValue(h, s, l, newA / 100)}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8">{Math.round(a * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Color group section
function ColorSection({ 
  title, 
  children,
  defaultOpen = false
}: { 
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-3 h-auto">
          <span className="font-medium">{title}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 space-y-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Live preview component
function ThemePreviewPane({ colors }: { colors: ThemeColors }) {
  return (
    <div 
      className="rounded-xl overflow-hidden border"
      style={{ background: `hsl(${colors.background})` }}
    >
      {/* Header preview */}
      <div 
        className="p-3 flex items-center gap-2 border-b"
        style={{ 
          background: `hsl(${colors.header})`,
          borderColor: `hsl(${colors.border})`,
        }}
      >
        <div 
          className="w-6 h-6 rounded-lg"
          style={{ background: `hsl(${colors.primary})` }}
        />
        <span 
          className="font-medium text-sm"
          style={{ color: `hsl(${colors.headerForeground})` }}
        >
          Header
        </span>
      </div>
      
      {/* Content preview */}
      <div className="p-3 space-y-3">
        <p 
          className="font-medium"
          style={{ color: `hsl(${colors.foreground})` }}
        >
          Preview Content
        </p>
        <p 
          className="text-sm"
          style={{ color: `hsl(${colors.mutedForeground})` }}
        >
          This is muted text for descriptions.
        </p>
        
        {/* Card preview */}
        <div 
          className="p-3 rounded-lg border"
          style={{ 
            background: `hsl(${colors.card})`,
            borderColor: `hsl(${colors.border})`,
          }}
        >
          <p 
            className="text-sm font-medium"
            style={{ color: `hsl(${colors.cardForeground})` }}
          >
            Card Component
          </p>
        </div>
        
        {/* Button previews */}
        <div className="flex gap-2 flex-wrap">
          <button
            className="px-3 py-1.5 rounded-md text-sm font-medium"
            style={{ 
              background: `hsl(${colors.primary})`,
              color: `hsl(${colors.primaryForeground})`,
            }}
          >
            Primary
          </button>
          <button
            className="px-3 py-1.5 rounded-md text-sm font-medium"
            style={{ 
              background: `hsl(${colors.secondary})`,
              color: `hsl(${colors.secondaryForeground})`,
            }}
          >
            Secondary
          </button>
          <button
            className="px-3 py-1.5 rounded-md text-sm font-medium"
            style={{ 
              background: `hsl(${colors.accent})`,
              color: `hsl(${colors.accentForeground})`,
            }}
          >
            Accent
          </button>
          <button
            className="px-3 py-1.5 rounded-md text-sm font-medium"
            style={{ 
              background: `hsl(${colors.destructive})`,
              color: `hsl(${colors.destructiveForeground})`,
            }}
          >
            Destructive
          </button>
        </div>
        
        {/* Status colors */}
        <div className="flex gap-2 flex-wrap">
          <span
            className="px-2 py-1 rounded text-xs font-medium"
            style={{ 
              background: `hsl(${colors.success})`,
              color: `hsl(${colors.successForeground})`,
            }}
          >
            Success
          </span>
          <span
            className="px-2 py-1 rounded text-xs font-medium"
            style={{ 
              background: `hsl(${colors.warning})`,
              color: `hsl(${colors.warningForeground})`,
            }}
          >
            Warning
          </span>
          <span
            className="px-2 py-1 rounded text-xs font-medium"
            style={{ 
              background: `hsl(${colors.info})`,
              color: `hsl(${colors.infoForeground})`,
            }}
          >
            Info
          </span>
        </div>
        
        {/* Glass preview */}
        <div 
          className="p-3 rounded-lg"
          style={{ 
            background: `hsl(${colors.glassBackground})`,
            border: `1px solid hsl(${colors.glassBorder})`,
            backdropFilter: `blur(${colors.glassBackdropBlur})`,
          }}
        >
          <p 
            className="text-sm"
            style={{ color: `hsl(${colors.foreground})` }}
          >
            Glass Effect
          </p>
        </div>
      </div>
    </div>
  );
}

interface CustomThemeEditorProps {
  theme: Theme;
  onSave: (updates: Partial<Theme>) => void;
  onCancel?: () => void;
}

export function CustomThemeEditor({ theme, onSave, onCancel }: CustomThemeEditorProps) {
  const { toast } = useToast();
  const [editedTheme, setEditedTheme] = useState<Theme>(theme);
  const [showPreview, setShowPreview] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  
  useEffect(() => {
    setEditedTheme(theme);
    setHasChanges(false);
  }, [theme]);
  
  const updateColors = (key: keyof ThemeColors, value: string) => {
    setEditedTheme(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
    setHasChanges(true);
  };
  
  const updateTheme = (updates: Partial<Theme>) => {
    setEditedTheme(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };
  
  const handleSave = () => {
    onSave({
      ...editedTheme,
      updatedAt: new Date().toISOString(),
    });
    setHasChanges(false);
    toast({
      title: 'Theme saved',
      description: `"${editedTheme.name}" has been updated.`,
    });
  };
  
  const handleReset = () => {
    setEditedTheme(theme);
    setHasChanges(false);
  };
  
  const handleExport = () => {
    const json = JSON.stringify(editedTheme, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-${editedTheme.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Theme exported',
      description: 'Theme file has been downloaded.',
    });
  };
  
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const imported = JSON.parse(text);
          if (imported.colors) {
            setEditedTheme(prev => ({
              ...prev,
              colors: { ...prev.colors, ...imported.colors },
              typography: imported.typography || prev.typography,
              spacing: imported.spacing || prev.spacing,
              effects: imported.effects || prev.effects,
            }));
            setHasChanges(true);
            toast({
              title: 'Theme imported',
              description: 'Theme colors have been applied.',
            });
          }
        } catch {
          toast({
            title: 'Import failed',
            description: 'Invalid theme file.',
            variant: 'destructive',
          });
        }
      }
    };
    input.click();
  };
  
  const { colors } = editedTheme;
  
  return (
    <div className="flex gap-4 h-full">
      {/* Editor panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-primary" />
            <Input
              value={editedTheme.name}
              onChange={(e) => updateTheme({ name: e.target.value })}
              className="font-medium text-lg h-9 w-48"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleImport}>
                  <Upload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Import theme</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export theme</TooltipContent>
            </Tooltip>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            
            {hasChanges && (
              <>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </>
            )}
            
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={editedTheme.isDark}
              onCheckedChange={(isDark) => updateTheme({ isDark })}
            />
            <Label>Dark Mode</Label>
          </div>
          
          <Input
            value={editedTheme.description}
            onChange={(e) => updateTheme({ description: e.target.value })}
            placeholder="Theme description..."
            className="flex-1"
          />
        </div>
        
        <Tabs defaultValue="colors" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="colors" className="gap-1">
              <Palette className="h-4 w-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="typography" className="gap-1">
              <Type className="h-4 w-4" />
              Typography
            </TabsTrigger>
            <TabsTrigger value="effects" className="gap-1">
              <Sparkles className="h-4 w-4" />
              Effects
            </TabsTrigger>
            <TabsTrigger value="spacing" className="gap-1">
              <Sliders className="h-4 w-4" />
              Spacing
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="colors" className="m-0 space-y-2">
              <ColorSection title="Core Colors" defaultOpen>
                <HSLColorPicker
                  label="Background"
                  value={colors.background}
                  onChange={(v) => updateColors('background', v)}
                  description="Main background color"
                />
                <HSLColorPicker
                  label="Foreground"
                  value={colors.foreground}
                  onChange={(v) => updateColors('foreground', v)}
                  description="Main text color"
                />
              </ColorSection>
              
              <ColorSection title="Primary Colors">
                <HSLColorPicker
                  label="Primary"
                  value={colors.primary}
                  onChange={(v) => updateColors('primary', v)}
                  description="Main brand/accent color"
                />
                <HSLColorPicker
                  label="Primary Foreground"
                  value={colors.primaryForeground}
                  onChange={(v) => updateColors('primaryForeground', v)}
                />
              </ColorSection>
              
              <ColorSection title="Secondary & Muted">
                <HSLColorPicker
                  label="Secondary"
                  value={colors.secondary}
                  onChange={(v) => updateColors('secondary', v)}
                />
                <HSLColorPicker
                  label="Secondary Foreground"
                  value={colors.secondaryForeground}
                  onChange={(v) => updateColors('secondaryForeground', v)}
                />
                <HSLColorPicker
                  label="Muted"
                  value={colors.muted}
                  onChange={(v) => updateColors('muted', v)}
                />
                <HSLColorPicker
                  label="Muted Foreground"
                  value={colors.mutedForeground}
                  onChange={(v) => updateColors('mutedForeground', v)}
                />
              </ColorSection>
              
              <ColorSection title="Card & Popover">
                <HSLColorPicker
                  label="Card"
                  value={colors.card}
                  onChange={(v) => updateColors('card', v)}
                />
                <HSLColorPicker
                  label="Card Foreground"
                  value={colors.cardForeground}
                  onChange={(v) => updateColors('cardForeground', v)}
                />
                <HSLColorPicker
                  label="Popover"
                  value={colors.popover}
                  onChange={(v) => updateColors('popover', v)}
                />
                <HSLColorPicker
                  label="Popover Foreground"
                  value={colors.popoverForeground}
                  onChange={(v) => updateColors('popoverForeground', v)}
                />
              </ColorSection>
              
              <ColorSection title="Accent & Destructive">
                <HSLColorPicker
                  label="Accent"
                  value={colors.accent}
                  onChange={(v) => updateColors('accent', v)}
                />
                <HSLColorPicker
                  label="Accent Foreground"
                  value={colors.accentForeground}
                  onChange={(v) => updateColors('accentForeground', v)}
                />
                <HSLColorPicker
                  label="Destructive"
                  value={colors.destructive}
                  onChange={(v) => updateColors('destructive', v)}
                />
                <HSLColorPicker
                  label="Destructive Foreground"
                  value={colors.destructiveForeground}
                  onChange={(v) => updateColors('destructiveForeground', v)}
                />
              </ColorSection>
              
              <ColorSection title="Border & Input">
                <HSLColorPicker
                  label="Border"
                  value={colors.border}
                  onChange={(v) => updateColors('border', v)}
                />
                <HSLColorPicker
                  label="Input"
                  value={colors.input}
                  onChange={(v) => updateColors('input', v)}
                />
                <HSLColorPicker
                  label="Ring"
                  value={colors.ring}
                  onChange={(v) => updateColors('ring', v)}
                />
              </ColorSection>
              
              <ColorSection title="Header & Sidebar">
                <HSLColorPicker
                  label="Header"
                  value={colors.header}
                  onChange={(v) => updateColors('header', v)}
                />
                <HSLColorPicker
                  label="Header Foreground"
                  value={colors.headerForeground}
                  onChange={(v) => updateColors('headerForeground', v)}
                />
                <HSLColorPicker
                  label="Sidebar Background"
                  value={colors.sidebarBackground}
                  onChange={(v) => updateColors('sidebarBackground', v)}
                />
                <HSLColorPicker
                  label="Sidebar Foreground"
                  value={colors.sidebarForeground}
                  onChange={(v) => updateColors('sidebarForeground', v)}
                />
                <HSLColorPicker
                  label="Sidebar Primary"
                  value={colors.sidebarPrimary}
                  onChange={(v) => updateColors('sidebarPrimary', v)}
                />
                <HSLColorPicker
                  label="Sidebar Accent"
                  value={colors.sidebarAccent}
                  onChange={(v) => updateColors('sidebarAccent', v)}
                />
              </ColorSection>
              
              <ColorSection title="Status Colors">
                <HSLColorPicker
                  label="Success"
                  value={colors.success}
                  onChange={(v) => updateColors('success', v)}
                />
                <HSLColorPicker
                  label="Success Foreground"
                  value={colors.successForeground}
                  onChange={(v) => updateColors('successForeground', v)}
                />
                <HSLColorPicker
                  label="Warning"
                  value={colors.warning}
                  onChange={(v) => updateColors('warning', v)}
                />
                <HSLColorPicker
                  label="Warning Foreground"
                  value={colors.warningForeground}
                  onChange={(v) => updateColors('warningForeground', v)}
                />
                <HSLColorPicker
                  label="Info"
                  value={colors.info}
                  onChange={(v) => updateColors('info', v)}
                />
                <HSLColorPicker
                  label="Info Foreground"
                  value={colors.infoForeground}
                  onChange={(v) => updateColors('infoForeground', v)}
                />
              </ColorSection>
              
              <ColorSection title="Glass Effects">
                <HSLColorPicker
                  label="Glass Background"
                  value={colors.glassBackground}
                  onChange={(v) => updateColors('glassBackground', v)}
                />
                <HSLColorPicker
                  label="Glass Border"
                  value={colors.glassBorder}
                  onChange={(v) => updateColors('glassBorder', v)}
                />
                <div className="space-y-2">
                  <Label>Glass Blur</Label>
                  <Input
                    value={colors.glassBackdropBlur}
                    onChange={(e) => updateColors('glassBackdropBlur', e.target.value)}
                    placeholder="20px"
                  />
                </div>
              </ColorSection>
            </TabsContent>
            
            <TabsContent value="typography" className="m-0 space-y-4 p-4">
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Input
                  value={editedTheme.typography.fontFamily}
                  onChange={(e) => updateTheme({
                    typography: { ...editedTheme.typography, fontFamily: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Monospace Font</Label>
                <Input
                  value={editedTheme.typography.fontFamilyMono}
                  onChange={(e) => updateTheme({
                    typography: { ...editedTheme.typography, fontFamilyMono: e.target.value }
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Base Size</Label>
                  <Input
                    value={editedTheme.typography.fontSizeBase}
                    onChange={(e) => updateTheme({
                      typography: { ...editedTheme.typography, fontSizeBase: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Small Size</Label>
                  <Input
                    value={editedTheme.typography.fontSizeSm}
                    onChange={(e) => updateTheme({
                      typography: { ...editedTheme.typography, fontSizeSm: e.target.value }
                    })}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="effects" className="m-0 space-y-4 p-4">
              <div className="space-y-2">
                <Label>Glass Blur</Label>
                <Input
                  value={editedTheme.effects.glassBlur}
                  onChange={(e) => updateTheme({
                    effects: { ...editedTheme.effects, glassBlur: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Glass Saturation</Label>
                <Input
                  value={editedTheme.effects.glassSaturation}
                  onChange={(e) => updateTheme({
                    effects: { ...editedTheme.effects, glassSaturation: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Shadow Small</Label>
                <Input
                  value={editedTheme.effects.shadowSm}
                  onChange={(e) => updateTheme({
                    effects: { ...editedTheme.effects, shadowSm: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Shadow Large</Label>
                <Input
                  value={editedTheme.effects.shadowLg}
                  onChange={(e) => updateTheme({
                    effects: { ...editedTheme.effects, shadowLg: e.target.value }
                  })}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="spacing" className="m-0 space-y-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Base Radius</Label>
                  <Input
                    value={editedTheme.spacing.radius}
                    onChange={(e) => updateTheme({
                      spacing: { ...editedTheme.spacing, radius: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Small Radius</Label>
                  <Input
                    value={editedTheme.spacing.radiusSm}
                    onChange={(e) => updateTheme({
                      spacing: { ...editedTheme.spacing, radiusSm: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Large Radius</Label>
                  <Input
                    value={editedTheme.spacing.radiusLg}
                    onChange={(e) => updateTheme({
                      spacing: { ...editedTheme.spacing, radiusLg: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>XL Radius</Label>
                  <Input
                    value={editedTheme.spacing.radiusXl}
                    onChange={(e) => updateTheme({
                      spacing: { ...editedTheme.spacing, radiusXl: e.target.value }
                    })}
                  />
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
      
      {/* Preview panel */}
      {showPreview && (
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-0">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Live Preview
            </h3>
            <ThemePreviewPane colors={editedTheme.colors} />
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomThemeEditor;
