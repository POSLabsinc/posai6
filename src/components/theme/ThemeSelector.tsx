import { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Check, 
  Palette,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useTheme, useCustomThemes } from '@/contexts/ThemeContext';
import { Theme } from '@/lib/theme-types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

// Theme preview component
function ThemePreview({ theme, isActive }: { theme: Theme; isActive: boolean }) {
  return (
    <div 
      className={`
        relative w-full h-12 rounded-lg overflow-hidden border-2 transition-all
        ${isActive ? 'border-primary ring-2 ring-primary/30' : 'border-border'}
      `}
      style={{
        background: `hsl(${theme.colors.background})`,
      }}
    >
      {/* Mini preview of theme colors */}
      <div className="absolute inset-0 flex items-center px-2 gap-1">
        <div 
          className="w-6 h-6 rounded-md"
          style={{ background: `hsl(${theme.colors.primary})` }}
        />
        <div 
          className="w-4 h-4 rounded"
          style={{ background: `hsl(${theme.colors.secondary})` }}
        />
        <div 
          className="w-4 h-4 rounded"
          style={{ background: `hsl(${theme.colors.accent})` }}
        />
        <div className="flex-1" />
        <div 
          className="text-xs font-medium px-2 py-0.5 rounded"
          style={{ 
            color: `hsl(${theme.colors.foreground})`,
            background: `hsl(${theme.colors.muted})`,
          }}
        >
          Aa
        </div>
      </div>
      {isActive && (
        <div className="absolute top-1 right-1">
          <Check className="w-3 h-3 text-primary" />
        </div>
      )}
    </div>
  );
}

// Theme card for the full selector
function ThemeCard({ 
  theme, 
  isActive, 
  onSelect,
  onDuplicate,
  onDelete,
  isCustom
}: { 
  theme: Theme;
  isActive: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete?: () => void;
  isCustom: boolean;
}) {
  return (
    <div 
      className={`
        group relative p-3 rounded-xl cursor-pointer transition-all
        border-2 hover:scale-[1.02]
        ${isActive 
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
          : 'border-border bg-card hover:border-primary/50'
        }
      `}
      onClick={onSelect}
    >
      <ThemePreview theme={theme} isActive={isActive} />
      
      <div className="mt-2 flex items-start justify-between">
        <div>
          <p className="font-medium text-foreground text-sm">{theme.name}</p>
          <p className="text-xs text-muted-foreground">{theme.isDark ? 'Dark' : 'Light'}</p>
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
          {isCustom && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Quick theme toggle button
export function ThemeToggle() {
  const { theme, setTheme, themes, systemThemeEnabled, setSystemThemeEnabled } = useTheme();
  
  const cycleTheme = () => {
    if (systemThemeEnabled) {
      setSystemThemeEnabled(false);
      setTheme('light');
    } else if (theme.id === 'light') {
      setTheme('dark');
    } else if (theme.id === 'dark') {
      setSystemThemeEnabled(true);
    } else {
      // For other themes, just toggle dark mode
      const targetDark = !theme.isDark;
      const newTheme = themes.find(t => t.isDark === targetDark);
      if (newTheme) setTheme(newTheme.id);
    }
  };
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="relative"
    >
      {systemThemeEnabled ? (
        <Monitor className="h-5 w-5" />
      ) : theme.isDark ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}

// Dropdown theme selector
export function ThemeDropdown() {
  const { theme, setTheme, themes, systemThemeEnabled, setSystemThemeEnabled } = useTheme();
  const { duplicateTheme, deleteCustomTheme } = useCustomThemes();
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [themeToDuplicate, setThemeToDuplicate] = useState<Theme | null>(null);
  const [newThemeName, setNewThemeName] = useState('');
  
  const lightThemes = themes.filter(t => !t.isDark);
  const darkThemes = themes.filter(t => t.isDark);
  const customThemes = themes.filter(t => t.isCustom);
  
  const handleDuplicate = (themeToClone: Theme) => {
    setThemeToDuplicate(themeToClone);
    setNewThemeName(`${themeToClone.name} Copy`);
    setDuplicateDialogOpen(true);
  };
  
  const confirmDuplicate = () => {
    if (themeToDuplicate && newThemeName.trim()) {
      const newTheme = duplicateTheme(themeToDuplicate.id, newThemeName.trim());
      if (newTheme) {
        setTheme(newTheme.id);
      }
      setDuplicateDialogOpen(false);
      setThemeToDuplicate(null);
      setNewThemeName('');
    }
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">{theme.name}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* System theme option */}
          <DropdownMenuItem
            onClick={() => setSystemThemeEnabled(true)}
            className="gap-2"
          >
            <Monitor className="h-4 w-4" />
            <span>System</span>
            {systemThemeEnabled && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Light themes */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Light Themes
            </DropdownMenuLabel>
            {lightThemes.map((t) => (
              <DropdownMenuItem
                key={t.id}
                onClick={() => setTheme(t.id)}
                className="gap-2"
              >
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ background: `hsl(${t.colors.primary})` }}
                />
                <span>{t.name}</span>
                {!systemThemeEnabled && theme.id === t.id && (
                  <Check className="h-4 w-4 ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          {/* Dark themes */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Dark Themes
            </DropdownMenuLabel>
            {darkThemes.filter(t => !t.isCustom).map((t) => (
              <DropdownMenuItem
                key={t.id}
                onClick={() => setTheme(t.id)}
                className="gap-2"
              >
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ background: `hsl(${t.colors.primary})` }}
                />
                <span>{t.name}</span>
                {!systemThemeEnabled && theme.id === t.id && (
                  <Check className="h-4 w-4 ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          
          {/* Custom themes */}
          {customThemes.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Custom Themes
                </DropdownMenuLabel>
                {customThemes.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className="gap-2"
                  >
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ background: `hsl(${t.colors.primary})` }}
                    />
                    <span>{t.name}</span>
                    {!systemThemeEnabled && theme.id === t.id && (
                      <Check className="h-4 w-4 ml-auto" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Duplicate theme dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Theme</DialogTitle>
            <DialogDescription>
              Create a copy of "{themeToDuplicate?.name}" that you can customize.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="theme-name">Theme Name</Label>
            <Input
              id="theme-name"
              value={newThemeName}
              onChange={(e) => setNewThemeName(e.target.value)}
              placeholder="My Custom Theme"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDuplicate} disabled={!newThemeName.trim()}>
              Create Theme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Full theme selector panel
export function ThemeSelectorPanel() {
  const { theme, setTheme, themes, systemThemeEnabled, setSystemThemeEnabled } = useTheme();
  const { duplicateTheme, deleteCustomTheme } = useCustomThemes();
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [themeToDuplicate, setThemeToDuplicate] = useState<Theme | null>(null);
  const [newThemeName, setNewThemeName] = useState('');
  
  const lightThemes = themes.filter(t => !t.isDark && !t.isCustom);
  const darkThemes = themes.filter(t => t.isDark && !t.isCustom);
  const customThemes = themes.filter(t => t.isCustom);
  
  const handleDuplicate = (themeToClone: Theme) => {
    setThemeToDuplicate(themeToClone);
    setNewThemeName(`${themeToClone.name} Copy`);
    setDuplicateDialogOpen(true);
  };
  
  const confirmDuplicate = () => {
    if (themeToDuplicate && newThemeName.trim()) {
      const newTheme = duplicateTheme(themeToDuplicate.id, newThemeName.trim());
      if (newTheme) {
        setTheme(newTheme.id);
      }
      setDuplicateDialogOpen(false);
      setThemeToDuplicate(null);
      setNewThemeName('');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* System theme toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
        <div className="flex items-center gap-3">
          <Monitor className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">System Theme</p>
            <p className="text-sm text-muted-foreground">
              Automatically match your device settings
            </p>
          </div>
        </div>
        <Button
          variant={systemThemeEnabled ? "default" : "outline"}
          size="sm"
          onClick={() => setSystemThemeEnabled(!systemThemeEnabled)}
        >
          {systemThemeEnabled ? 'On' : 'Off'}
        </Button>
      </div>
      
      {/* Light themes */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sun className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Light Themes</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {lightThemes.map((t) => (
            <ThemeCard
              key={t.id}
              theme={t}
              isActive={!systemThemeEnabled && theme.id === t.id}
              onSelect={() => {
                setSystemThemeEnabled(false);
                setTheme(t.id);
              }}
              onDuplicate={() => handleDuplicate(t)}
              isCustom={false}
            />
          ))}
        </div>
      </div>
      
      {/* Dark themes */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Moon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Dark Themes</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {darkThemes.map((t) => (
            <ThemeCard
              key={t.id}
              theme={t}
              isActive={!systemThemeEnabled && theme.id === t.id}
              onSelect={() => {
                setSystemThemeEnabled(false);
                setTheme(t.id);
              }}
              onDuplicate={() => handleDuplicate(t)}
              isCustom={false}
            />
          ))}
        </div>
      </div>
      
      {/* Custom themes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Custom Themes</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleDuplicate(theme)}
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            Create New
          </Button>
        </div>
        
        {customThemes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-xl border-dashed">
            <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No custom themes yet</p>
            <p className="text-sm">Duplicate a theme to create your own</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {customThemes.map((t) => (
              <ThemeCard
                key={t.id}
                theme={t}
                isActive={!systemThemeEnabled && theme.id === t.id}
                onSelect={() => {
                  setSystemThemeEnabled(false);
                  setTheme(t.id);
                }}
                onDuplicate={() => handleDuplicate(t)}
                onDelete={() => deleteCustomTheme(t.id)}
                isCustom={true}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Duplicate theme dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Theme</DialogTitle>
            <DialogDescription>
              Create a copy of "{themeToDuplicate?.name}" that you can customize.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="panel-theme-name">Theme Name</Label>
            <Input
              id="panel-theme-name"
              value={newThemeName}
              onChange={(e) => setNewThemeName(e.target.value)}
              placeholder="My Custom Theme"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDuplicate} disabled={!newThemeName.trim()}>
              Create Theme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ThemeSelectorPanel;
