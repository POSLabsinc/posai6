import { useMemo, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, Mic, Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
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
import AddTaxContent from "./AddTaxContent";
import EditTaxContent from "./EditTaxContent";
import SwipeableTaxItem from "./SwipeableTaxItem";
import { supabase } from "@/integrations/supabase/client";

interface Tax {
  id: string;
  name: string;
  amount: number;
  type: "Exclusive" | "Inclusive";
  archived: boolean;
  applicableTo?: string;
  applicableProducts?: string[];
}

interface TaxesContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const SHARED_DEVICE_ID = "shared";

const TaxesContent = ({ showHeader = true, onBack, onAIClick }: TaxesContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTaxes = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("taxes")
      .select("*")
      .eq("device_id", SHARED_DEVICE_ID)
      .order("sort_order");
    
    if (data && !error) {
      const mapped: Tax[] = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        amount: Number(d.amount),
        type: d.type as "Exclusive" | "Inclusive",
        archived: d.archived,
        applicableTo: d.applicable_to,
        applicableProducts: d.applicable_products || [],
      }));
      setTaxes(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTaxes();
  }, [fetchTaxes]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [taxToArchive, setTaxToArchive] = useState<Tax | null>(null);
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [taxToEdit, setTaxToEdit] = useState<Tax | null>(null);

  const handleAddTax = async (taxData: {
    name: string;
    amount: number;
    type: "Exclusive" | "Inclusive";
    applicableTo: string;
    applicableProducts: string[];
  }) => {
    const { error } = await (supabase as any).from("taxes").insert({
      device_id: SHARED_DEVICE_ID,
      name: taxData.name,
      amount: taxData.amount,
      type: taxData.type,
      applicable_to: taxData.applicableTo || "All Products",
      applicable_products: taxData.applicableProducts || [],
      archived: false,
      sort_order: taxes.length,
    });

    if (!error) {
      await fetchTaxes();
      toast({ description: "Tax added successfully" });
    } else {
      toast({ description: "Failed to add tax", variant: "destructive" });
    }
    setShowAddScreen(false);
  };

  const handleEditTax = async (updatedTax: Tax) => {
    await (supabase as any).from("taxes").update({
      name: updatedTax.name,
      amount: updatedTax.amount,
      type: updatedTax.type,
      applicable_to: updatedTax.applicableTo || "All Products",
      applicable_products: updatedTax.applicableProducts || [],
      archived: updatedTax.archived,
    }).eq("id", updatedTax.id);

    await fetchTaxes();
    setTaxToEdit(null);
  };

  const handleArchiveTax = (tax: Tax) => {
    setTaxToArchive(tax);
  };

  const confirmArchiveTax = async () => {
    if (taxToArchive) {
      const newArchived = !taxToArchive.archived;
      await (supabase as any).from("taxes").update({ archived: newArchived }).eq("id", taxToArchive.id);
      await fetchTaxes();
      setTaxToArchive(null);
    }
  };

  const filteredTaxes = useMemo(() => {
    return taxes.filter((tax) => {
      const matchesSearch = tax.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesArchiveFilter = showArchived ? tax.archived : !tax.archived;
      return matchesSearch && matchesArchiveFilter;
    });
  }, [taxes, searchQuery, showArchived]);

  if (showAddScreen) {
    return (
      <AddTaxContent 
        onBack={() => setShowAddScreen(false)} 
        onSave={handleAddTax} 
      />
    );
  }

  if (taxToEdit) {
    return (
      <EditTaxContent 
        tax={taxToEdit}
        onBack={() => setTaxToEdit(null)} 
        onSave={handleEditTax} 
      />
    );
  }

  // Desktop / Tablet layout (do not affect mobile)
  if (!isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">
        {showHeader && onBack && (
          <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Taxes</h1>
      </div>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!taxToArchive} onOpenChange={() => setTaxToArchive(null)}>
        <AlertDialogContent className="bg-neutral-800 border-neutral-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {taxToArchive?.archived ? "Restore Tax" : "Archive Tax"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              {taxToArchive?.archived 
                ? `Are you sure you want to restore "${taxToArchive?.name}"? It will appear in your active taxes list.`
                : `Are you sure you want to archive "${taxToArchive?.name}"? You can restore it later from the archive.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-700 text-foreground border-neutral-600 hover:bg-neutral-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmArchiveTax}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {taxToArchive?.archived ? "Restore" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TaxesContent;
