import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, UserCheck, UserPlus } from "lucide-react";
import { searchCustomers, type Customer } from "@/services/customerService";
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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
      if (name) { const [f, ...r] = name.split(' '); setFirstName(f); setLastName(r.join(' ')); }
    }
    if (email && email.includes('@')) {
      setEmailQuery(email);
      if (name) { const [f, ...r] = name.split(' '); setFirstName(f); setLastName(r.join(' ')); }
    }
    if (!phone && !email && name) {
      const [f, ...r] = name.split(' '); setFirstName(f); setLastName(r.join(' '));
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
      let cancelled = false;
      searchCustomers(digits).then(results => {
        if (cancelled) return;
        setSearchResults(results);
        setShowResults(results.length > 0);
        if (digits.length === selectedCountry.phoneLength) {
          if (results.length === 0) {
            setIsNewCustomer(true);
            setMatchedCustomer(null);
          } else {
            const exact = results.find(c => c.phone.replace(/\D/g, '').slice(-10) === digits.slice(-10));
            if (exact) {
              setMatchedCustomer(exact);
              const [f, ...r] = exact.name.split(' '); setFirstName(f); setLastName(r.join(' '));
              setEmailQuery(exact.email || '');
              setIsNewCustomer(false);
            } else {
              setMatchedCustomer(null);
              setIsNewCustomer(true);
            }
          }
        } else {
          setMatchedCustomer(null);
          setIsNewCustomer(false);
        }
      });
      return () => { cancelled = true; };
    } else {
      setSearchResults([]);
      setMatchedCustomer(null);
    }
  }, [searchQuery, selectedCountry.phoneLength]);

  // Search by email
  useEffect(() => {
    if (!emailQuery.trim() || matchedCustomer) return;

    if (emailQuery.includes('@')) {
      let cancelled = false;
      searchCustomers(emailQuery).then(results => {
        if (cancelled) return;
        const emailResults = results.filter(c => c.email?.toLowerCase().includes(emailQuery.toLowerCase()));
        setSearchResults(emailResults);
        setShowResults(emailResults.length > 0);
        if (emailQuery.includes('.') && emailResults.length === 0) {
          setIsNewCustomer(true);
        } else {
          const exact = emailResults.find(c => c.email?.toLowerCase() === emailQuery.toLowerCase());
          if (exact) {
            setMatchedCustomer(exact);
            const [f, ...r] = exact.name.split(' '); setFirstName(f); setLastName(r.join(' '));
            setSearchQuery(exact.phone.replace(/\D/g, ''));
            setIsNewCustomer(false);
          } else {
            setMatchedCustomer(null);
          }
        }
      });
      return () => { cancelled = true; };
    } else {
      setSearchResults([]);
      setMatchedCustomer(null);
    }
  }, [emailQuery]);

  const selectCustomer = (c: Customer) => {
    setMatchedCustomer(c);
    const [f, ...r] = c.name.split(' '); setFirstName(f); setLastName(r.join(' '));
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

  // Update name fields without auto-confirming on every keystroke
  const handleNameChange = (first: string, last: string) => {
    setFirstName(first.slice(0, 40));
    setLastName(last.slice(0, 40));
  };

  // Confirm new guest explicitly via button (no onBlur to avoid accidental navigate)
  const confirmNewGuest = () => {
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName.length > 0) {
      const cust: VoucherCustomer = {
        name: fullName,
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
      <div className="flex gap-2 items-start relative" ref={resultsRef} style={{ overflow: 'visible' }}>
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
        {/* Search results dropdown - inside resultsRef so clicks register */}
        {showResults && searchResults.length > 0 && !matchedCustomer && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-600 rounded-lg overflow-hidden z-50 shadow-xl">
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
      </div>

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

      {/* New customer - name required; Confirm Guest button (no onBlur to avoid accidental continue) */}
      {isNewCustomer && !matchedCustomer && (
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-lg p-3 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 text-xs font-medium">New guest — enter their name</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={firstName}
              onChange={(e) => handleNameChange(e.target.value, lastName)}
              placeholder="First name"
              className={`${inputClass} flex-1`}
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => handleNameChange(firstName, e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmNewGuest(); }}
              placeholder="Last name"
              className={`${inputClass} flex-1`}
            />
          </div>
          <button
            type="button"
            onClick={confirmNewGuest}
            disabled={!firstName.trim()}
            className="mt-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Guest
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerStep;
