import { useState } from "react";
import { 
  Palette, 
  Layout, 
  Download, 
  Upload, 
  RotateCcw,
  Save,
  FileJson,
  Settings2,
  Monitor,
  Bell,
  Shield,
  Database
} from "lucide-react";
import { useTheme, useCustomThemes } from "@/contexts/ThemeContext";
import { ThemeSelectorPanel, ThemeDropdown } from "@/components/theme/ThemeSelector";
import { CustomThemeEditor } from "@/components/theme/CustomThemeEditor";
import { LayoutCustomizerPanel, LayoutPresets } from "@/components/layout/LayoutCustomizer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { toast } = useToast();
  const { 
    theme, 
    preferences, 
    exportPreferences, 
    importPreferences, 
    resetPreferences 
  } = useTheme();
  const { customThemes, updateCustomTheme } = useCustomThemes();
  const [editingTheme, setEditingTheme] = useState<string | null>(null);
  
  const handleExport = () => {
    const json = exportPreferences();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme-preferences.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Preferences exported',
      description: 'Your theme and layout preferences have been downloaded.',
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
          if (importPreferences(text)) {
            toast({
              title: 'Preferences imported',
              description: 'Your theme and layout preferences have been applied.',
            });
          } else {
            throw new Error('Invalid file');
          }
        } catch {
          toast({
            title: 'Import failed',
            description: 'Could not import preferences file.',
            variant: 'destructive',
          });
        }
      }
    };
    input.click();
  };
  
  const handleReset = () => {
    if (confirm('Reset all preferences to default? This cannot be undone.')) {
      resetPreferences();
      toast({
        title: 'Preferences reset',
        description: 'All theme and layout preferences have been reset to defaults.',
      });
    }
  };
  
  const themeToEdit = editingTheme 
    ? customThemes.find(t => t.id === editingTheme) 
    : null;

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Customize your experience
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeDropdown />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="appearance" className="gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="layout" className="gap-2">
                <Layout className="h-4 w-4" />
                <span className="hidden sm:inline">Layout</span>
              </TabsTrigger>
              <TabsTrigger value="editor" className="gap-2">
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">Theme Editor</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Data</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="appearance" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Theme Selection
                  </CardTitle>
                  <CardDescription>
                    Choose from built-in themes or create your own custom themes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ThemeSelectorPanel />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="layout" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    Layout Customization
                  </CardTitle>
                  <CardDescription>
                    Adjust the layout to match your workflow
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Quick Presets</h4>
                    <LayoutPresets />
                  </div>
                  
                  <Separator />
                  
                  <LayoutCustomizerPanel />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="editor" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    Custom Theme Editor
                  </CardTitle>
                  <CardDescription>
                    {themeToEdit 
                      ? `Editing "${themeToEdit.name}"`
                      : 'Select a custom theme to edit, or duplicate an existing theme to create a new one'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {themeToEdit ? (
                    <CustomThemeEditor
                      theme={themeToEdit}
                      onSave={(updates) => {
                        updateCustomTheme(themeToEdit.id, updates);
                      }}
                      onCancel={() => setEditingTheme(null)}
                    />
                  ) : customThemes.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Select a custom theme to edit:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {customThemes.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setEditingTheme(t.id)}
                            className="p-3 rounded-xl border-2 border-border hover:border-primary transition-colors text-left"
                          >
                            <div 
                              className="w-full h-8 rounded-lg mb-2"
                              style={{ background: `hsl(${t.colors.background})` }}
                            />
                            <p className="font-medium text-sm">{t.name}</p>
                            <p className="text-xs text-muted-foreground">{t.isDark ? 'Dark' : 'Light'}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No custom themes yet</p>
                      <p className="text-sm mt-1">
                        Go to the Appearance tab and duplicate a theme to create your first custom theme
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="data" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Export Preferences
                    </CardTitle>
                    <CardDescription>
                      Download your theme and layout preferences as a JSON file
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleExport} className="w-full gap-2">
                      <FileJson className="h-4 w-4" />
                      Export to File
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Import Preferences
                    </CardTitle>
                    <CardDescription>
                      Load theme and layout preferences from a JSON file
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleImport} variant="outline" className="w-full gap-2">
                      <FileJson className="h-4 w-4" />
                      Import from File
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <RotateCcw className="h-5 w-5" />
                      Reset Preferences
                    </CardTitle>
                    <CardDescription>
                      Reset all theme and layout preferences to their default values. 
                      This will delete all custom themes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleReset} variant="destructive" className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Reset All Preferences
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Current Preferences</CardTitle>
                    <CardDescription>
                      Raw preview of your current preference data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 rounded-lg bg-muted text-xs overflow-auto max-h-64 font-mono">
                      {JSON.stringify({
                        activeTheme: theme.name,
                        customThemesCount: customThemes.length,
                        systemThemeEnabled: preferences.systemThemeEnabled,
                        layout: preferences.layout.sidebar,
                      }, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Settings;
