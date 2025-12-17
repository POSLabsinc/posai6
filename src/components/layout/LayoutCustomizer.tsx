import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  GripVertical, 
  Move, 
  Lock, 
  Unlock, 
  RotateCcw,
  Settings,
  PanelLeft,
  PanelRight,
  PanelTop,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useLayoutCustomization, useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

// Layout customization panel
export function LayoutCustomizerPanel() {
  const { layout, updateSidebarLayout, resetLayout } = useLayoutCustomization();
  const { sidebar } = layout;
  
  return (
    <div className="space-y-6">
      {/* Sidebar Settings */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <PanelLeft className="h-4 w-4" />
          Sidebar
        </h3>
        
        <div className="space-y-4 pl-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="sidebar-position">Position</Label>
            <div className="flex gap-1">
              <Button
                variant={sidebar.sidebarPosition === 'left' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSidebarLayout({ sidebarPosition: 'left' })}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={sidebar.sidebarPosition === 'right' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSidebarLayout({ sidebarPosition: 'right' })}
              >
                <PanelRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="sidebar-collapsed">Collapsed</Label>
            <Switch
              id="sidebar-collapsed"
              checked={sidebar.sidebarCollapsed}
              onCheckedChange={(checked) => updateSidebarLayout({ sidebarCollapsed: checked })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Width: {sidebar.sidebarWidth}</Label>
            <Slider
              value={[parseInt(sidebar.sidebarWidth)]}
              min={60}
              max={120}
              step={4}
              onValueChange={([value]) => updateSidebarLayout({ sidebarWidth: `${value}px` })}
            />
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Header Settings */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <PanelTop className="h-4 w-4" />
          Header
        </h3>
        
        <div className="space-y-4 pl-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="header-visible">Visible</Label>
            <Switch
              id="header-visible"
              checked={sidebar.headerVisible}
              onCheckedChange={(checked) => updateSidebarLayout({ headerVisible: checked })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Height: {sidebar.headerHeight}</Label>
            <Slider
              value={[parseInt(sidebar.headerHeight)]}
              min={48}
              max={96}
              step={4}
              onValueChange={([value]) => updateSidebarLayout({ headerHeight: `${value}px` })}
            />
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Bottom Navigation */}
      <div className="space-y-4">
        <h3 className="font-medium">Bottom Navigation</h3>
        
        <div className="space-y-4 pl-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="bottom-nav-visible">Visible (Mobile)</Label>
            <Switch
              id="bottom-nav-visible"
              checked={sidebar.bottomNavVisible}
              onCheckedChange={(checked) => updateSidebarLayout({ bottomNavVisible: checked })}
            />
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Compact Mode */}
      <div className="space-y-4">
        <h3 className="font-medium">Display</h3>
        
        <div className="space-y-4 pl-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="compact-mode">Compact Mode</Label>
              <p className="text-xs text-muted-foreground">Reduce spacing and padding</p>
            </div>
            <Switch
              id="compact-mode"
              checked={sidebar.compactMode}
              onCheckedChange={(checked) => updateSidebarLayout({ compactMode: checked })}
            />
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Reset */}
      <Button variant="outline" className="w-full" onClick={resetLayout}>
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset to Default
      </Button>
    </div>
  );
}

// Floating layout toggle button
export function LayoutCustomizerButton() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed bottom-20 right-4 z-50 shadow-lg">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Customize Layout</SheetTitle>
          <SheetDescription>
            Adjust the layout to your preference
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <LayoutCustomizerPanel />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Draggable panel wrapper
interface DraggablePanelProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  defaultPosition?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  locked?: boolean;
  onLockedChange?: (locked: boolean) => void;
}

export function DraggablePanel({
  id,
  children,
  className = '',
  defaultPosition = { x: 0, y: 0 },
  onPositionChange,
  locked = false,
  onLockedChange,
}: DraggablePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLocked, setIsLocked] = useState(locked);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isLocked) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [isLocked, position]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newPosition = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };
    setPosition(newPosition);
  }, [isDragging, dragStart]);
  
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onPositionChange?.(position);
    }
  }, [isDragging, position, onPositionChange]);
  
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  const toggleLock = () => {
    const newLocked = !isLocked;
    setIsLocked(newLocked);
    onLockedChange?.(newLocked);
  };
  
  return (
    <div
      ref={panelRef}
      className={`absolute ${className} ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease',
      }}
    >
      <div className="relative group">
        {/* Drag handle */}
        <div 
          className={`
            absolute -top-8 left-0 right-0 flex items-center justify-center gap-1
            opacity-0 group-hover:opacity-100 transition-opacity
            ${isLocked ? 'pointer-events-none' : ''}
          `}
        >
          <div
            className={`
              flex items-center gap-1 px-2 py-1 rounded-t-md
              bg-card border border-b-0 border-border
              ${isLocked ? '' : 'cursor-grab'}
            `}
            onMouseDown={handleMouseDown}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
            <Move className="h-3 w-3 text-muted-foreground" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-t-md rounded-b-none border border-b-0"
            onClick={toggleLock}
          >
            {isLocked ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Unlock className="h-3 w-3" />
            )}
          </Button>
        </div>
        
        {children}
      </div>
    </div>
  );
}

// Resizable panel component
interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onResize?: (size: { width: number; height: number }) => void;
  className?: string;
}

export function ResizablePanel({
  children,
  defaultWidth = 300,
  defaultHeight = 400,
  minWidth = 200,
  minHeight = 200,
  maxWidth = 800,
  maxHeight = 800,
  onResize,
  className = '',
}: ResizablePanelProps) {
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'e' | 's' | 'se' | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  const handleMouseDown = (direction: 'e' | 's' | 'se') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;
      
      const rect = panelRef.current.getBoundingClientRect();
      let newWidth = size.width;
      let newHeight = size.height;
      
      if (resizeDirection === 'e' || resizeDirection === 'se') {
        newWidth = Math.min(maxWidth, Math.max(minWidth, e.clientX - rect.left));
      }
      if (resizeDirection === 's' || resizeDirection === 'se') {
        newHeight = Math.min(maxHeight, Math.max(minHeight, e.clientY - rect.top));
      }
      
      setSize({ width: newWidth, height: newHeight });
    };
    
    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        setResizeDirection(null);
        onResize?.(size);
      }
    };
    
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, resizeDirection, size, minWidth, minHeight, maxWidth, maxHeight, onResize]);
  
  return (
    <div
      ref={panelRef}
      className={`relative ${className}`}
      style={{ width: size.width, height: size.height }}
    >
      {children}
      
      {/* Resize handles */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-e-resize hover:bg-primary/50 transition-colors"
        onMouseDown={handleMouseDown('e')}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize hover:bg-primary/50 transition-colors"
        onMouseDown={handleMouseDown('s')}
      />
      <div
        className="absolute right-0 bottom-0 w-3 h-3 cursor-se-resize hover:bg-primary/50 transition-colors"
        onMouseDown={handleMouseDown('se')}
      />
    </div>
  );
}

// Collapsible sidebar wrapper that respects layout settings
export function CustomizableSidebar({ 
  children,
  className = '',
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  const { layout, updateSidebarLayout } = useLayoutCustomization();
  const { sidebar } = layout;
  
  if (sidebar.sidebarCollapsed) {
    return (
      <div 
        className={`flex flex-col items-center py-2 bg-sidebar border-r border-sidebar-border ${className}`}
        style={{ width: '48px' }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="mb-2"
          onClick={() => updateSidebarLayout({ sidebarCollapsed: false })}
        >
          {sidebar.sidebarPosition === 'left' ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }
  
  return (
    <div 
      className={`relative ${className}`}
      style={{ width: sidebar.sidebarWidth }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 h-6 w-6"
        onClick={() => updateSidebarLayout({ sidebarCollapsed: true })}
      >
        {sidebar.sidebarPosition === 'left' ? (
          <ChevronLeft className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </Button>
      {children}
    </div>
  );
}

// Panel visibility toggle
export function PanelVisibilityToggle({
  panelId,
  label,
  visible,
  onToggle,
}: {
  panelId: string;
  label: string;
  visible: boolean;
  onToggle: (visible: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <Label htmlFor={panelId}>{label}</Label>
      <Button
        id={panelId}
        variant="ghost"
        size="icon"
        onClick={() => onToggle(!visible)}
      >
        {visible ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}

// Quick layout presets
export function LayoutPresets() {
  const { updateSidebarLayout, resetLayout } = useLayoutCustomization();
  
  const presets = [
    {
      name: 'Default',
      icon: Maximize2,
      apply: resetLayout,
    },
    {
      name: 'Compact',
      icon: Minimize2,
      apply: () => updateSidebarLayout({
        sidebarCollapsed: true,
        compactMode: true,
        headerVisible: true,
      }),
    },
    {
      name: 'Full Screen',
      icon: Maximize2,
      apply: () => updateSidebarLayout({
        sidebarCollapsed: true,
        headerVisible: false,
        bottomNavVisible: false,
      }),
    },
  ];
  
  return (
    <div className="flex gap-2">
      {presets.map((preset) => (
        <Button
          key={preset.name}
          variant="outline"
          size="sm"
          onClick={preset.apply}
          className="gap-1"
        >
          <preset.icon className="h-3 w-3" />
          {preset.name}
        </Button>
      ))}
    </div>
  );
}

export default LayoutCustomizerPanel;
