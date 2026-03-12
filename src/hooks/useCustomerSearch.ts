import { useState, useEffect, useRef, useCallback } from "react";
import { searchCustomers, checkPhoneConflict, Customer } from "@/services/customerService";

/**
 * Hook that replaces synchronous in-memory customer search with async DB queries.
 * Used by all guest forms (TakeOut, DineIn, Delivery, etc.)
 */
export function useCustomerSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await searchCustomers(searchQuery);
      setSearchResults(results);
      setShowSearchResults(results.length > 0);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    showSearchResults,
    setShowSearchResults,
    isSearching,
  };
}

/**
 * Hook for async phone conflict detection (debounced).
 */
export function usePhoneConflict(phoneNumber: string, guestName: string) {
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictCustomer, setConflictCustomer] = useState<Customer | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const lastCheckedRef = useRef("");

  useEffect(() => {
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    const key = `${cleanPhone}::${guestName.toLowerCase().trim()}`;
    
    if (cleanPhone.length !== 10 || !guestName.trim() || key === lastCheckedRef.current) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const conflict = await checkPhoneConflict(phoneNumber, guestName);
      lastCheckedRef.current = key;
      if (conflict) {
        setConflictCustomer(conflict);
        setShowConflictDialog(true);
      }
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [phoneNumber, guestName]);

  const clearConflict = useCallback(() => {
    setShowConflictDialog(false);
    setConflictCustomer(null);
  }, []);

  return {
    showConflictDialog,
    setShowConflictDialog,
    conflictCustomer,
    setConflictCustomer,
    clearConflict,
  };
}
