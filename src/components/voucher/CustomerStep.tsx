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
      setSearchMode('phone');
      setSearchQuery(phone.replace(/\D/g, ''));
      if (name) setCustomerName(name);
    } else if (email && email.includes('@')) {
      setSearchMode('email');
      setSearchQuery(email);
      if (name) setCustomerName(name);
    } else if (name) {
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

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setMatchedCustomer(null);
      setIsNewCustomer(false);
      return;
    }

    if (searchMode === 'phone') {
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
    } else {
      // email search
      if (searchQuery.includes('@')) {
        const results = customers.filter(c => c.email?.toLowerCase().includes(searchQuery.toLowerCase()));
        setSearchResults(results);
        setShowResults(results.length > 0);
        const exact = results.find(c => c.email?.toLowerCase() === searchQuery.toLowerCase());
        if (exact) {
          setMatchedCustomer(exact);
          setCustomerName(exact.name);
          setIsNewCustomer(false);
        } else {
          setMatchedCustomer(null);
          setIsNewCustomer(searchQuery.includes('@') && searchQuery.includes('.'));
        }
      } else {
        setSearchResults([]);
        setMatchedCustomer(null);
      }
    }
  }, [searchQuery, searchMode, selectedCountry.phoneLength]);

  const selectCustomer = (c: Customer) => {
    setMatchedCustomer(c);
    setCustomerName(c.name);
    setIsNewCustomer(false);
    setShowResults(false);
    if (searchMode === 'phone') {
      setSearchQuery(c.phone.replace(/\D/g, ''));
    } else {
      setSearchQuery(c.email || '');
    }
    onCustomerIdentified({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      isNew: false,
    });
  };

  const handleContinue = () => {
    const cust: VoucherCustomer = matchedCustomer
      ? { id: matchedCustomer.id, name: matchedCustomer.name, phone: matchedCustomer.phone, email: matchedCustomer.email || '', isNew: false }
      : {
          name: customerName.trim(),
          phone: searchMode === 'phone' ? searchQuery : '',
          email: searchMode === 'email' ? searchQuery : '',
          isNew: true,
        };
    onCustomerIdentified(cust);
    onContinue();
  };

  const canContinue = (matchedCustomer || (isNewCustomer && customerName.trim().length > 0));

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-white font-semibold text-sm">Who is this voucher for?</h3>
        <p className="text-neutral-400 text-xs mt-0.5">Identify the customer before proceeding</p>
      </div>

      {/* Toggle: Phone / Email */}
      <div className="flex bg-neutral-800 rounded-lg p-0.5 gap-0.5">
        <button
          onClick={() => { setSearchMode('phone'); setSearchQuery(''); setMatchedCustomer(null); setIsNewCustomer(false); }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${searchMode === 'phone' ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:text-white'}`}
        >
          Phone
        </button>
        <button
          onClick={() => { setSearchMode('email'); setSearchQuery(''); setMatchedCustomer(null); setIsNewCustomer(false); }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${searchMode === 'email' ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:text-white'}`}
        >
          Email
        </button>
      </div>

      {/* Search Input */}
      <div className="relative" ref={resultsRef} style={{ overflow: 'visible' }}>
        {searchMode === 'phone' ? (
          <div className="flex">
            <div className="relative" ref={countryRef}>
              <button
                type="button"
                onClick={() => { setShowCountryDropdown(p => !p); setCountrySearch(''); }}
                className="h-[46px] bg-neutral-800 border border-neutral-600 border-r-0 rounded-l-lg px-3 text-sm text-white flex items-center gap-1.5 hover:bg-neutral-700 transition-colors whitespace-nowrap"
              >
                <span className="text-base">{selectedCountry.flag}</span>
                <span className="text-neutral-300 text-xs">{selectedCountry.dial}</span>
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
              className={`${inputClass} rounded-l-none flex-1`}
            />
          </div>
        ) : (
          <input
            type="email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.slice(0, 100))}
            placeholder="customer@email.com"
            autoFocus
            className={inputClass}
          />
        )}

        {/* Search results dropdown */}
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

      {/* New customer - name required */}
      {isNewCustomer && !matchedCustomer && (
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-lg p-3 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 text-xs font-medium">New customer — enter their name</span>
          </div>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value.slice(0, 80))}
            placeholder="Customer name"
            className={inputClass}
          />
        </div>
      )}

      {/* Continue button */}
      <button
        onClick={handleContinue}
        disabled={!canContinue}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${canContinue ? 'bg-white text-black hover:bg-neutral-200' : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'}`}
      >
        Continue
      </button>
    </div>
  );
};

export default CustomerStep;
