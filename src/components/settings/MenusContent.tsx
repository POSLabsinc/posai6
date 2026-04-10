import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMenus, deleteMenu, Menu } from "@/lib/menuStore";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MenusContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onNavigate?: (path: string) => void;
  onAIClick?: () => void;
}

const MenusContent = ({
  showHeader = true,
  onBack,
  onNavigate,
  onAIClick,
}: MenusContentProps) => {
  const menus = useMenus();
  const [deleteTarget, setDeleteTarget] = useState<Menu | null>(null);
  const isMobile = useIsMobile();

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMenu(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const content = (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
        {onBack ? (
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        ) : (
          <div className="w-8 h-8" />
        )}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          <h1 className="text-base font-medium text-foreground">Menus</h1>
        </div>
        <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
                    <button
                      onClick={() => setDeleteTarget(menu)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Delete menu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                {index < menus.length - 1 && (
                  <div className="h-px bg-border/50 mx-4" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new menu button */}
        <button
          onClick={() => onNavigate?.("/settings/menu/menus/add")}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#26262699] text-foreground hover:bg-[hsl(var(--surface-1))] transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add Menu</span>
        </button>

        {menus.length === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            No menus yet. Add your first menu to get started.
          </p>
        )}
      </div>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this menu. Items and categories will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return content;
};

export default MenusContent;
