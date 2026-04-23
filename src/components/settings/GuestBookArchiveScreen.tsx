import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

type SortKey = "name" | "phone" | "email" | "loyalty" | "since" | "updated_at";
type SortDir = "asc" | "desc";

const formatDate = (raw?: string | null) => {
  if (!raw) return "—";
  try {
    return format(new Date(raw), "dd MMM yy");
  } catch {
    return raw;
  }
};

const GuestBookArchiveScreen = ({ onBack }: GuestBookArchiveScreenProps) => {
  const [archived, setArchived] = useState<ArchivedGuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
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

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    const list = [...archived];
    list.sort((a, b) => {
      const av = (a[sortKey] ?? "") as string;
      const bv = (b[sortKey] ?? "") as string;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [archived, sortKey, sortDir]);

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain bg-background">
      {/* Header — icon-only back button */}
      <div className="flex items-center h-12 px-4 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center text-foreground hover:opacity-70 transition-opacity"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Hero */}
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
            Review guests you've archived. Swipe a row to restore the guest back
            to your guest book or remove them permanently.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="px-4 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-card rounded-2xl py-16 text-center">
            <p className="text-sm text-muted-foreground">No archived guests yet.</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[2fr_1.6fr_2fr_1.2fr_1.2fr_auto] items-center gap-4 px-4 py-3 border-b border-border/50">
              <button onClick={() => handleSort("name")} className="text-sm text-foreground font-medium text-left">Name</button>
              <button onClick={() => handleSort("phone")} className="text-sm text-foreground font-medium text-left">Phone</button>
              <button onClick={() => handleSort("email")} className="text-sm text-foreground font-medium text-left">Email</button>
              <button onClick={() => handleSort("since")} className="text-sm text-foreground font-medium text-left">Since</button>
              <button onClick={() => handleSort("updated_at")} className="text-sm text-foreground font-medium text-left">Archived</button>
              <span className="w-4" />
            </div>
            {/* Rows */}
            {sorted.map(g => (
              <SwipeableGuestItem
                key={g.id}
                onTap={() => {}}
                onArchive={() => handleRestore(g.id)}
                onRemove={() => handleRemove(g.id)}
                isArchived
              >
                <div className="grid grid-cols-[2fr_1.6fr_2fr_1.2fr_1.2fr_auto] items-center gap-4 px-4 py-3 bg-card hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      {g.avatar_url ? <AvatarImage src={g.avatar_url} alt={g.name} /> : null}
                      <AvatarFallback
                        style={{ backgroundColor: g.avatar_bg || "#6B7280" }}
                        className="text-white text-xs font-medium"
                      >
                        {g.initials || g.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-foreground truncate">{g.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground truncate">{g.phone || "—"}</span>
                  <span className="text-sm text-muted-foreground truncate">{g.email || "—"}</span>
                  <span className="text-sm text-muted-foreground truncate">{formatDate(g.since)}</span>
                  <span className="text-sm text-muted-foreground truncate">{formatDate(g.updated_at)}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
