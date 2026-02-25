import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, UserCheck, UserPlus } from "lucide-react";
import { customers, searchCustomers, type Customer } from "@/data/customers";
import { COUNTRY_CODES, inputClass, labelClass, type CountryCodeEntry, type VoucherCustomer } from "./voucherConstants";
import { formatPhone } from "./voucherHelpers";

interface CustomerStepProps {
  customer: VoucherCustomer | null;
  onCustomerIdentified: (customer: VoucherCustomer) => void;
  onContinue: () => void;
  initialGuestData?: { name?: string; phone?: string; email?: string } | null;
}

const CustomerStep = ({ customer, onCustomerIdentified, onContinue, initialGuestData }: CustomerStepProps) => {
  const [searchMode, setSearchMode] = useState<'phone' | 'email'>('phone');
  const [searchQuery, setSearchQuery] = useState('');
  const [emailQuery, setEmailQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCodeEntry>(COUNTRY_CODES[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [didPrefill, setDidPrefill] = useState(false);

  // Pre-fill from guest data (order section)
  useEffect(() => {
    if (didPrefill || customer) return;
    if (!initialGuestData) return;
    const { name, phone, email } = initialGuestData;
    if (phone && phone.replace(/\D/g, '').length >= 3) {
      setSearchQuery(phone.replace(/\D/g, ''));
      if (name) setCustomerName(name);
    }
    if (email && email.includes('@')) {
      setEmailQuery(email);
      if (name) setCustomerName(name);
    }
    if (!phone && !email && name) {
      setCustomerName(name);
      setIsNewCustomer(true);
    }
    setDidPrefill(true);
  }, [initialGuestData, customer, didPrefill]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setShowCountryDropdown(false);
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search by phone
  useEffect(() => {
    if (!searchQuery.trim()) {
      if (!emailQuery.trim()) {
        setSearchResults([]);
        setMatchedCustomer(null);
        setIsNewCustomer(false);
      }
      return;
    }

    const digits = searchQuery.replace(/\D/g, '');
    if (digits.length >= 3) {
      const results = customers.filter(c => c.phone.replace(/\D/g, '').includes(digits));
      setSearchResults(results);
      setShowResults(results.length > 0);
      if (digits.length === selectedCountry.phoneLength) {
        const exact = results.find(c => c.phone.replace(/\D/g, '') === digits);
        if (exact) {
          setMatchedCustomer(exact);
          setCustomerName(exact.name);
          setEmailQuery(exact.email || '');
          setIsNewCustomer(false);
        } else {
          setMatchedCustomer(null);
          setIsNewCustomer(true);
        }
      } else {
        setMatchedCustomer(null);
        setIsNewCustomer(false);
      }
    } else {
      setSearchResults([]);
      setMatchedCustomer(null);
    }
  }, [searchQuery, selectedCountry.phoneLength]);

  // Search by email
  useEffect(() => {
    if (!emailQuery.trim() || searchQuery.trim()) return;

    if (emailQuery.includes('@')) {
      const results = customers.filter(c => c.email?.toLowerCase().includes(emailQuery.toLowerCase()));
      setSearchResults(results);
      setShowResults(results.length > 0);
      const exact = results.find(c => c.email?.toLowerCase() === emailQuery.toLowerCase());
      if (exact) {
        setMatchedCustomer(exact);
        setCustomerName(exact.name);
        setSearchQuery(exact.phone.replace(/\D/g, ''));
        setIsNewCustomer(false);
      } else {
        setMatchedCustomer(null);
        setIsNewCustomer(emailQuery.includes('@') && emailQuery.includes('.'));
      }
    } else {
      setSearchResults([]);
      setMatchedCustomer(null);
    }
  }, [emailQuery]);

  const selectCustomer = (c: Customer) => {
    setMatchedCustomer(c);
    setCustomerName(c.name);
    setIsNewCustomer(false);
    setShowResults(false);
    setSearchQuery(c.phone.replace(/\D/g, ''));
    setEmailQuery(c.email || '');
    const cust: VoucherCustomer = {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      isNew: false,
    };
    onCustomerIdentified(cust);
    onContinue();
  };

  // Auto-confirm new customer when name is entered
  const handleNewCustomerNameChange = (name: string) => {
    setCustomerName(name.slice(0, 80));
    if (name.trim().length > 0) {
      const cust: VoucherCustomer = {
        name: name.trim(),
        phone: searchQuery || '',
        email: emailQuery || '',
        isNew: true,
      };
      onCustomerIdentified(cust);
      onContinue();
    }
  };

  return (
    <div className="space-y-3">
      {/* Phone + Email in one row */}
      <div className="flex gap-2 items-start" ref={resultsRef} style={{ overflow: 'visible' }}>
        {/* Phone field */}
        <div className="flex-1 relative">
          <label className={`${labelClass} mb-1 block`}>Phone Number</label>
          <div className="flex">
            <div className="relative" ref={countryRef}>
              <button
                type="button"
                onClick={() => { setShowCountryDropdown(p => !p); setCountrySearch(''); }}
                className="h-[42px] bg-neutral-800 border border-neutral-600 border-r-0 rounded-l-lg px-2.5 text-sm text-white flex items-center gap-1 hover:bg-neutral-700 transition-colors whitespace-nowrap"
              >
                <span className="text-sm">{selectedCountry.flag}</span>
                <span className="text-neutral-300 text-[11px]">{selectedCountry.dial}</span>
                <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showCountryDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-neutral-800 border border-neutral-600 rounded-lg overflow-hidden z-50 shadow-xl">
                  <div className="p-2 border-b border-neutral-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                      <input
                        type="text"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        placeholder="Search country..."
                        autoFocus
                        className="w-full bg-neutral-900 border border-neutral-600 rounded-md pl-8 pr-3 py-2 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500"
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto scrollbar-hide">
                    {COUNTRY_CODES
                      .filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.dial.includes(countrySearch))
                      .map(c => (
                        <button
                          key={c.code}
                          onClick={() => { setSelectedCountry(c); setShowCountryDropdown(false); setSearchQuery(''); }}
                          className={`w-full px-3 py-2.5 text-sm text-left flex items-center gap-2.5 transition-colors ${selectedCountry.code === c.code ? 'bg-white/10 text-white' : 'text-neutral-300 hover:bg-white/5'}`}
                        >
                          <span className="text-base">{c.flag}</span>
                          <span className="flex-1 truncate">{c.name}</span>
                          <span className="text-neutral-500 text-xs">{c.dial}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <input
              type="tel"
              inputMode="numeric"
              value={formatPhone(searchQuery, selectedCountry.format)}
              onChange={(e) => setSearchQuery(e.target.value.replace(/\D/g, '').slice(0, selectedCountry.phoneLength))}
              placeholder={selectedCountry.placeholder}
              autoFocus
              className={`${inputClass} rounded-l-none flex-1 !h-[42px]`}
            />
          </div>
        </div>

        {/* Email field */}
        <div className="flex-1 relative">
          <label className={`${labelClass} mb-1 block`}>Email</label>
          <input
            type="email"
            value={emailQuery}
            onChange={(e) => setEmailQuery(e.target.value.slice(0, 100))}
            placeholder="guest@email.com"
            className={`${inputClass} !h-[42px]`}
          />
        </div>
      </div>

      {/* Search results dropdown */}
      {showResults && searchResults.length > 0 && !matchedCustomer && (
        <div className="bg-neutral-800 border border-neutral-600 rounded-lg overflow-hidden z-50 shadow-xl">
          <div className="max-h-40 overflow-y-auto scrollbar-hide">
            {searchResults.map(c => (
              <button
                key={c.id}
                onClick={() => selectCustomer(c)}
                className="w-full px-4 py-2.5 text-sm text-left flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div>
                  <span className="text-white">{c.name}</span>
                  <span className="text-neutral-500 text-xs ml-2">{c.phone}</span>
                </div>
                {c.email && <span className="text-neutral-500 text-xs">{c.email}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Matched customer card */}
      {matchedCustomer && (
        <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-3 flex items-center gap-3 animate-fade-in">
          <UserCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium">{matchedCustomer.name}</p>
            <p className="text-emerald-400/70 text-xs">{matchedCustomer.phone}{matchedCustomer.email ? ` · ${matchedCustomer.email}` : ''}</p>
            {matchedCustomer.orderCount && (
              <p className="text-neutral-400 text-xs mt-0.5">{matchedCustomer.orderCount} orders</p>
            )}
          </div>
        </div>
      )}

      {/* New customer - name required */}
      {isNewCustomer && !matchedCustomer && (
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-lg p-3 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 text-xs font-medium">New guest — enter their name</span>
          </div>
          <input
            type="text"
            value={customerName}
            onChange={(e) => handleNewCustomerNameChange(e.target.value)}
            placeholder="Guest name"
            className={inputClass}
          />
        </div>
      )}
    </div>
  );
};

export default CustomerStep;
