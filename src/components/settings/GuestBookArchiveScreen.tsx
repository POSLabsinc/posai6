import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ArchiveRestore, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppearance } from "@/contexts/AppearanceContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const isMobile = useIsMobile();
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
      {/* Header — icon-only back, matches other settings screens */}
      <div className="flex items-center pt-3 pb-2 px-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Hero — left-aligned icon + text, single-line description using full width */}
      <div className="px-6 pb-6">
        <div className="bg-card rounded-2xl px-6 py-6 flex items-center gap-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: getIconBgColor("#F9900E") }}
          >
            <img src={guestBookIcon} alt="Archive Guest" className="w-7 h-7 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-foreground mb-1">Archive Guest</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-nowrap overflow-hidden text-ellipsis">
              The guest book feature remembers your guests' dietary needs, allergies, and favorite dishes.
            </p>
          </div>
        </div>
      </div>

      {/* List / Table */}
      <div className="px-6 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : archived.length === 0 ? (
          <div className="bg-card rounded-2xl py-16 text-center">
            <p className="text-sm text-muted-foreground">No archived guests yet.</p>
          </div>
        ) : isMobile ? (
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
        ) : (
          <div className="bg-card rounded-2xl px-2">
            <Table>
              <TableHeader>
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead className="text-foreground font-semibold">Name</TableHead>
                  <TableHead className="text-foreground font-semibold">Phone</TableHead>
                  <TableHead className="text-foreground font-semibold">Email</TableHead>
                  <TableHead className="text-foreground font-semibold">Loyalty No</TableHead>
                  <TableHead className="text-foreground font-semibold">Since</TableHead>
                  <TableHead className="text-foreground font-semibold">Archive</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archived.map(g => (
                  <TableRow key={g.id} className="border-b-0 hover:bg-muted/40">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 flex-shrink-0">
                          {g.avatar_url ? <AvatarImage src={g.avatar_url} alt={g.name} /> : null}
                          <AvatarFallback
                            style={{ backgroundColor: g.avatar_bg || "#6B7280" }}
                            className="text-white text-xs font-medium"
                          >
                            {g.initials || g.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{g.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{g.phone || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{g.email || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{g.loyalty || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(g.since)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleRestore(g.id)}
                          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          title="Restore guest"
                        >
                          <ArchiveRestore className="w-4 h-4" />
                          <span>{formatDate(g.updated_at)}</span>
                        </button>
                        <button
                          onClick={() => handleRemove(g.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Remove permanently"
                          aria-label="Remove permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestBookArchiveScreen;
