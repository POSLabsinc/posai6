import { useState, useRef, useEffect } from "react";
import { User, Users, Building2, Search, ChevronDown } from "lucide-react";
import { MOCK_COMPANIES, inputClass, type PurchaseMode, type BuyerType, type CompanyProfile } from "./voucherConstants";

interface PurchaseTypeStepProps {
  purchaseMode: PurchaseMode;
  buyerType: BuyerType;
  selectedCompany: CompanyProfile | null;
  onPurchaseModeChange: (mode: PurchaseMode) => void;
  onBuyerTypeChange: (type: BuyerType) => void;
  onCompanySelect: (company: CompanyProfile | null) => void;
  onContinue: () => void;
  onBack: () => void;
}

const PurchaseTypeStep = ({
  purchaseMode, buyerType, selectedCompany,
  onPurchaseModeChange, onBuyerTypeChange, onCompanySelect,
  onContinue, onBack,
}: PurchaseTypeStepProps) => {
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const companyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) setShowCompanyDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredCompanies = MOCK_COMPANIES.filter(c =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="text-center mb-1">
        <h3 className="text-white font-semibold text-sm">Purchase Type</h3>
        <p className="text-neutral-400 text-xs mt-0.5">Choose quantity and buyer type</p>
      </div>

      {/* Single vs Multiple */}
      <div>
        <label className="text-neutral-400 text-xs font-medium mb-2 block">How many vouchers?</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onPurchaseModeChange('single')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${purchaseMode === 'single' ? 'border-white bg-white/10 text-white' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}
          >
            <User className="w-6 h-6" />
            <span className="text-sm font-medium">Single Voucher</span>
          </button>
          <button
            onClick={() => onPurchaseModeChange('multiple')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${purchaseMode === 'multiple' ? 'border-white bg-white/10 text-white' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}
          >
            <Users className="w-6 h-6" />
            <span className="text-sm font-medium">Multiple Vouchers</span>
          </button>
        </div>
      </div>

      {/* Personal vs Company */}
      <div>
        <label className="text-neutral-400 text-xs font-medium mb-2 block">Buyer type</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { onBuyerTypeChange('personal'); onCompanySelect(null); }}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${buyerType === 'personal' ? 'border-white bg-white/10 text-white' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-sm font-medium">Personal</span>
          </button>
          <button
            onClick={() => onBuyerTypeChange('company')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${buyerType === 'company' ? 'border-white bg-white/10 text-white' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-sm font-medium">Company</span>
          </button>
        </div>
      </div>

      {/* Company selector */}
      {buyerType === 'company' && (
        <div className="relative animate-fade-in" ref={companyRef}>
          <label className="text-neutral-400 text-xs font-medium mb-1.5 block">Select Company</label>
          <button
            type="button"
            onClick={() => { setShowCompanyDropdown(p => !p); setCompanySearch(''); }}
            className={`w-full flex items-center justify-between ${inputClass} cursor-pointer hover:border-neutral-500`}
          >
            <span className={selectedCompany ? 'text-white' : 'text-neutral-500'}>
              {selectedCompany ? selectedCompany.name : 'Select company account'}
            </span>
            <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showCompanyDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showCompanyDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-600 rounded-lg overflow-hidden z-50 shadow-xl">
              <div className="p-2 border-b border-neutral-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                  <input
                    type="text"
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    placeholder="Search company..."
                    autoFocus
                    className="w-full bg-neutral-900 border border-neutral-600 rounded-md pl-8 pr-3 py-2 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500"
                  />
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto scrollbar-hide">
                {filteredCompanies.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { onCompanySelect(c); setShowCompanyDropdown(false); }}
                    className={`w-full px-4 py-2.5 text-sm text-left flex items-center justify-between transition-colors ${selectedCompany?.id === c.id ? 'bg-white/10 text-white' : 'text-neutral-300 hover:bg-white/5'}`}
                  >
                    <span>{c.name}</span>
                    {c.email && <span className="text-neutral-500 text-xs">{c.email}</span>}
                  </button>
                ))}
                {filteredCompanies.length === 0 && (
                  <p className="px-4 py-3 text-neutral-500 text-xs text-center">No companies found</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl font-semibold text-sm border border-neutral-500 text-white hover:bg-neutral-800 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={buyerType === 'company' && !selectedCompany}
          className={`flex-[2] py-3 rounded-xl font-semibold text-sm transition-colors ${
            !(buyerType === 'company' && !selectedCompany) ? 'bg-white text-black hover:bg-neutral-200' : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default PurchaseTypeStep;
