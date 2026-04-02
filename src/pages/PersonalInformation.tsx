import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Pencil, Search, LocateFixed } from "lucide-react";
import roleIcon from "@/assets/icons/role-icon.png";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";

interface InfoRowProps {
  label: string;
  value: string;
  showArrow?: boolean;
}

const InfoRow = ({ label, value, showArrow = false }: InfoRowProps) => (
  <div className="flex items-center justify-between w-full py-4 px-5">
    <span className="text-foreground text-base font-medium">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-neutral-400 text-base">{value}</span>
      {showArrow && <ChevronRight className="w-5 h-5 text-neutral-500" />}
    </div>
  </div>
);

interface EditableInfoRowProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
}

const EditableInfoRow = ({ label, value, onChange, type = "text" }: EditableInfoRowProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = () => {
    setEditing(false);
    onChange(draft);
  };

  if (editing) {
    return (
      <div className="flex items-center justify-between w-full py-4 px-5">
        <span className="text-foreground text-base font-medium flex-shrink-0 mr-4">{label}</span>
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); } }}
          onBlur={save}
          className="bg-transparent text-neutral-400 text-base outline-none text-right flex-1"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      className="flex items-center justify-between w-full py-4 px-5 active:opacity-70 transition-opacity"
    >
      <span className="text-foreground text-base font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-neutral-400 text-base">{value}</span>
        <ChevronRight className="w-5 h-5 text-neutral-500" />
      </div>
    </button>
  );
};

const PersonalInformation = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("jimhopper@eatos.com");
  const [phone, setPhone] = useState("(123) 456 - 7890");
  const [addressQuery, setAddressQuery] = useState("");
  const [currentAddress, setCurrentAddress] = useState("24 High Street, Lancaster, LA1 1AB, United Kingdom");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const addressRef = useRef<HTMLDivElement>(null);

  const addressSuggestions = addressQuery.length >= 2 ? [
    `${addressQuery} Main Street, New York, NY 10001, USA`,
    `${addressQuery} Broadway, Los Angeles, CA 90001, USA`,
    `${addressQuery} Park Avenue, Chicago, IL 60601, USA`,
    `${addressQuery} Oak Lane, London, SW1A 1AA, UK`,
    `${addressQuery} High Street, Manchester, M1 1AA, UK`,
  ] : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addressRef.current && !addressRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectAddress = (address: string) => {
    setCurrentAddress(address);
    setAddressQuery("");
    setShowSuggestions(false);
  };

  const handleLocate = () => {
    setCurrentAddress("Current Location, Detected via GPS");
    setAddressQuery("");
    setShowSuggestions(false);
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-28">
      {/* Header with back button and AI icon */}
      <div className="relative flex items-center justify-center mb-8 overflow-visible h-12">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Personal Information</h1>
        <div className="absolute right-0 md:hidden">
          <AnimatedAIIcon size={24} onClick={() => navigate('/settings/ai')} />
        </div>
      </div>

      {/* Profile Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <Avatar className="w-24 h-24 border-2 border-neutral-700">
            <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face" alt="Jim Hopper" />
            <AvatarFallback className="bg-muted text-foreground text-2xl">JH</AvatarFallback>
          </Avatar>
          <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-neutral-700 border-2 border-neutral-900 flex items-center justify-center">
            <Pencil className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Info Sections */}
      <div className="space-y-4 px-2">
        <div className="bg-neutral-800/40 rounded-2xl overflow-hidden">
          <InfoRow label="Name" value="Jim Hopper" />
          <div className="h-px bg-neutral-700/50 mx-5" />
          <InfoRow label="Date of birth" value="08 January 1998" />
        </div>

        <div className="bg-neutral-800/40 rounded-2xl overflow-hidden">
          <EditableInfoRow label="Email" value={email} onChange={setEmail} type="email" />
          <div className="h-px bg-neutral-700/50 mx-5" />
          <EditableInfoRow label="Phone" value={phone} onChange={setPhone} type="tel" />
        </div>

        {/* Address Section */}
        <div className="space-y-3">
          <h2 className="text-neutral-400 text-base font-medium px-1">Address</h2>
          
          <div ref={addressRef} className="relative">
            <div className="bg-neutral-800/40 rounded-2xl overflow-hidden">
              <div className="flex items-center px-5 py-4">
                <Search className="w-5 h-5 text-neutral-500 mr-3" />
                <input
                  type="text"
                  placeholder="Search Address"
                  value={addressQuery}
                  onChange={(e) => {
                    setAddressQuery(e.target.value);
                    setShowSuggestions(e.target.value.length >= 2);
                  }}
                  onFocus={() => {
                    if (addressQuery.length >= 2) setShowSuggestions(true);
                  }}
                  className="flex-1 bg-transparent text-foreground placeholder:text-neutral-500 outline-none text-base"
                />
                <button onClick={handleLocate} className="active:opacity-70 transition-opacity">
                  <LocateFixed className="w-5 h-5 text-foreground" />
                </button>
              </div>
            </div>

            {showSuggestions && addressSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 rounded-2xl border border-neutral-700 overflow-hidden z-50 shadow-lg">
                {addressSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectAddress(suggestion)}
                    className="w-full text-left px-5 py-3 text-sm text-foreground hover:bg-neutral-700/50 transition-colors flex items-center gap-3"
                  >
                    <LocateFixed className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-neutral-800/40 rounded-2xl overflow-hidden px-5 py-4">
            <p className="text-neutral-400 text-base leading-relaxed">
              {currentAddress}
            </p>
          </div>
        </div>

          {/* Role Section */}
          <div className="bg-neutral-800/40 rounded-2xl overflow-hidden">
            <button className="flex items-center justify-between w-full py-4 px-5 active:opacity-70 transition-opacity">
              <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                  <img src={roleIcon} alt="Role" className="w-5 h-5" />
                </div>
                <span className="text-foreground text-base font-medium">Role</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 text-base">Manager</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInformation;
