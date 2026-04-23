import { useState, useEffect, useCallback } from "react";
import { ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppearance } from "@/contexts/AppearanceContext";
import guestBookIcon from "@/assets/icons/settings-guest-book.png";
import SwipeableGuestItem from "@/components/settings/SwipeableGuestItem";

interface ArchivedGuestRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  loyalty: string | null;
  since: string | null;
  initials: string | null;
  avatar_url: string | null;
  avatar_bg: string | null;
  updated_at: string;
}

interface GuestBookArchiveScreenProps {
  onBack: () => void;
}

const formatDate = (raw?: string | null) => {
  if (!raw) return "—";
  try {
    return format(new Date(raw), "dd MMM yy");
  } catch {
    return "—";
  }
};

const GuestBookArchiveScreen = ({ onBack }: GuestBookArchiveScreenProps) => {
  const [archived, setArchived] = useState<ArchivedGuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { getIconBgColor } = useAppearance();

  const fetchArchived = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("guests")
      .select("id, name, phone, email, loyalty, since, initials, avatar_url, avatar_bg, updated_at")
      .eq("is_archived", true)
      .order("updated_at", { ascending: false });
    setArchived(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArchived();
  }, [fetchArchived]);

  const handleRestore = async (id: string) => {
    await (supabase as any).from("guests").update({ is_archived: false }).eq("id", id);
    setArchived(prev => prev.filter(g => g.id !== id));
  };

  const handleRemove = async (id: string) => {
    await (supabase as any).from("guests").delete().eq("id", id);
    setArchived(prev => prev.filter(g => g.id !== id));
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain bg-background">
      {/* Header — icon-only back button (matches Add New Guest pattern) */}
      <div className="flex items-center h-12 px-4 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center text-foreground hover:opacity-70 transition-opacity"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Hero — centered icon + title + multi-line description (matches Add New Guest) */}
      <div className="px-4 pt-2 pb-4">
        <div className="bg-neutral-800/60 rounded-2xl p-5 flex flex-col items-center text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ backgroundColor: getIconBgColor("#F9900E") }}
          >
            <img src={guestBookIcon} alt="" className="w-6 h-6 object-contain" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Archive Guest</h3>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-md">
            The guest book feature remembers your guests' dietary needs,
            allergies, and favorite dishes.
          </p>
        </div>
      </div>

      {/* List — swipe to reveal Restore / Remove (icons only) */}
      <div className="px-4 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : archived.length === 0 ? (
          <div className="bg-card rounded-2xl py-16 text-center">
            <p className="text-sm text-muted-foreground">No archived guests yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {archived.map(g => (
              <SwipeableGuestItem
                key={g.id}
                onTap={() => {}}
                onArchive={() => handleRestore(g.id)}
                onRemove={() => handleRemove(g.id)}
                isArchived
              >
                <div className="bg-card rounded-xl p-3 flex items-center gap-3">
                  <Avatar className="w-11 h-11 flex-shrink-0">
                    {g.avatar_url ? <AvatarImage src={g.avatar_url} alt={g.name} /> : null}
                    <AvatarFallback
                      style={{ backgroundColor: g.avatar_bg || "#6B7280" }}
                      className="text-white text-sm font-medium"
                    >
                      {g.initials || g.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{g.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{g.email || g.phone || "—"}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDate(g.updated_at)}
                  </span>
                </div>
              </SwipeableGuestItem>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestBookArchiveScreen;
