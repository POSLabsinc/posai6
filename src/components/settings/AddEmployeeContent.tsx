import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, User, Camera, Search, X, Briefcase, UtensilsCrossed, Wine, ShoppingBag, LayoutGrid, Truck, PartyPopper, Armchair, Coffee, ConciergeBell, Delete, MapPin, Check, Star } from "lucide-react";
import { useAddEmployee, useUpdateEmployee, useStores, useEmployeeStores, useSaveEmployeeStores } from "@/hooks/use-employees";
import { toast } from "sonner";
import { countryCodes, type CountryCode } from "@/components/CountryCodeSelector";
import serverIcon from "@/assets/icons/jobs/server.svg";
import bartenderIcon from "@/assets/icons/jobs/bartender.svg";
import hostIcon from "@/assets/icons/jobs/host.svg";
import managerIcon from "@/assets/icons/jobs/manager.svg";
import baristaIcon from "@/assets/icons/jobs/barista.svg";
import runnerIcon from "@/assets/icons/jobs/runner.svg";

const JOB_ROLE_ICONS: Record<string, string | null> = {
  "Server": serverIcon,
  "Bartender": bartenderIcon,
  "Host": hostIcon,
  "Manager": managerIcon,
  "Barista": baristaIcon,
  "Runner": runnerIcon,
  "Admin": null,
  "Cashier": null,
  "Chef": null,
};

interface AddEmployeeContentProps {
  showHeader?: boolean;
  onBack?: () => void;
}

const roles = ["Server", "Manager", "Host", "Admin", "Cashier", "Chef", "Bartender", "Barista", "Runner"];
const jobTypes = ["Full Time", "Part Time", "Contract", "Temporary", "Seasonal", "Intern", "Freelance", "On-Call", "Volunteer"];
const revenueCenters = ["Bar", "Restaurant", "Takeout", "Delivery", "Catering", "Patio", "Lounge", "Drive-Thru", "All"];

const AddEmployeeContent = ({ showHeader = true, onBack }: AddEmployeeContentProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const editEmployee = (location.state as any)?.editEmployee;
  const isEditMode = !!editEmployee;
  const addEmployee = useAddEmployee();
  const updateEmployee = useUpdateEmployee();
  const saveEmployeeStores = useSaveEmployeeStores();
  const { data: allStores = [] } = useStores();
  const { data: existingEmployeeStores = [] } = useEmployeeStores(editEmployee?.id || null);
  const goBack = onBack || (() => navigate("/settings/workforce/employee"));

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(countryCodes[0]);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState("");
  const [revenueCenter, setRevenueCenter] = useState("");
  const [pin, setPin] = useState("");
  const [dashboardAccess, setDashboardAccess] = useState(false);
  const [payrollEnabled, setPayrollEnabled] = useState(false);
  const [jobType, setJobType] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [assignedStoreIds, setAssignedStoreIds] = useState<string[]>([]);
  const [primaryStoreId, setPrimaryStoreId] = useState<string | null>(null);
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");
  // Pre-fill fields in edit mode
  useEffect(() => {
    if (editEmployee) {
      const nameParts = (editEmployee.full_name || "").split(" ");
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");
      setEmail(editEmployee.email || "");
      setRole(editEmployee.role || "");
      setRevenueCenter(editEmployee.revenue_center || "");
      setHourlyRate(editEmployee.hourly_rate ? String(editEmployee.hourly_rate) : "");
      setPin(editEmployee.pin && editEmployee.pin !== "0000" ? editEmployee.pin : "");
      // Parse phone - try to extract country code and number
      if (editEmployee.phone) {
        const phoneParts = editEmployee.phone.split(" ");
        if (phoneParts.length >= 2) {
          const dialCode = phoneParts[0];
          const matchedCountry = countryCodes.find(c => c.dialCode === dialCode);
          if (matchedCountry) setSelectedCountry(matchedCountry);
          setPhone(phoneParts.slice(1).join(""));
        } else {
          setPhone(editEmployee.phone);
        }
      }
      // Job type from assigned_job_types
      if (editEmployee.assigned_job_types?.length > 0) {
        setJobType(editEmployee.assigned_job_types[0]);
      }
    }
  }, [editEmployee]);

  // Pre-fill store assignments in edit mode
  useEffect(() => {
    if (existingEmployeeStores.length > 0) {
      setAssignedStoreIds(existingEmployeeStores.map((es: any) => es.store_id));
      const primary = existingEmployeeStores.find((es: any) => es.is_primary);
      setPrimaryStoreId(primary ? primary.store_id : existingEmployeeStores[0].store_id);
    }
  }, [existingEmployeeStores]);
  // Dropdown/popup states
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showRevenuePicker, setShowRevenuePicker] = useState(false);
  const [showJobTypePicker, setShowJobTypePicker] = useState(false);
  const [showPinPopup, setShowPinPopup] = useState(false);
  const [pinStep, setPinStep] = useState<"new" | "confirm">("new");
  const [newPinValue, setNewPinValue] = useState("");
  const [confirmPinValue, setConfirmPinValue] = useState("");
  const [pinError, setPinError] = useState("");

  const hasData = firstName.trim() || lastName.trim() || email.trim() || phone.trim() || role || jobType || hourlyRate || pin;

  const handleBackPress = async () => {
    if (!hasData) {
      goBack();
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }
    if (firstName.trim().length > 50 || lastName.trim().length > 50) {
      toast.error("Names must be under 50 characters");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email");
      return;
    }

    try {
      let savedEmployeeId = editEmployee?.id;
      if (isEditMode) {
        await updateEmployee.mutateAsync({
          id: editEmployee.id,
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          role: role || "Server",
          email: email.trim() || null,
          phone: phone.trim() ? `${selectedCountry.dialCode} ${phone.trim()}` : null,
          hourly_rate: hourlyRate ? parseFloat(hourlyRate) : 0,
          pin: pin.length === 4 ? pin : undefined,
          revenue_center: revenueCenter || undefined,
          assigned_job_types: jobType ? [jobType] : undefined,
        });
        // Save store assignments
        if (assignedStoreIds.length > 0) {
          await saveEmployeeStores.mutateAsync({
            employeeId: editEmployee.id,
            storeIds: assignedStoreIds,
            primaryStoreId,
          });
        }
        toast.success("Employee updated successfully");
      } else {
        // For new employees, we need the ID back to save store assignments
        const { data: newEmp } = await (supabase as any).from("employees").insert({
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          role: role || "Server",
          email: email.trim() || undefined,
          phone: phone.trim() ? `${selectedCountry.dialCode} ${phone.trim()}` : undefined,
          hourly_rate: hourlyRate ? parseFloat(hourlyRate) : 0,
          pin: pin.length === 4 ? pin : undefined,
        }).select("id").single();
        if (newEmp) savedEmployeeId = newEmp.id;
        // Save store assignments for new employee
        if (savedEmployeeId && assignedStoreIds.length > 0) {
          await saveEmployeeStores.mutateAsync({
            employeeId: savedEmployeeId,
            storeIds: assignedStoreIds,
            primaryStoreId,
          });
        }
        toast.success("Employee added successfully");
      }
      goBack();
    } catch {
      toast.error(isEditMode ? "Failed to update employee" : "Failed to add employee");
    }
  };

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Header */}
      {showHeader && (
      <div className="flex items-center px-4 py-3 shrink-0 relative">
        <button
          onClick={handleBackPress}
          className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground absolute left-1/2 -translate-x-1/2">{isEditMode ? "Edit Employee" : "Add New Employee"}</h1>
      </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-28">
        {/* Avatar */}
        <div className="flex flex-col items-center py-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center border-2 border-neutral-700">
              <User className="w-10 h-10 text-neutral-500" />
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-neutral-700 border-2 border-background flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 text-neutral-300" />
            </button>
          </div>
        </div>

        {/* Name Section */}
        <div className="mx-4 bg-[#26262699] rounded-2xl overflow-hidden mb-4">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-700/30">
            <span className="text-sm text-foreground font-medium">First Name</span>
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="Required"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={50}
                className="text-right text-sm text-neutral-400 placeholder:text-neutral-600 bg-transparent outline-none w-36"
              />
              <ChevronRight className="w-4 h-4 text-neutral-600 shrink-0" />
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-foreground font-medium">Last Name</span>
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="Required"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={50}
                className="text-right text-sm text-neutral-400 placeholder:text-neutral-600 bg-transparent outline-none w-36"
              />
              <ChevronRight className="w-4 h-4 text-neutral-600 shrink-0" />
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mx-4 bg-[#26262699] rounded-2xl overflow-hidden mb-4">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-700/30">
            <span className="text-sm text-foreground font-medium">Email</span>
            <div className="flex items-center gap-1">
              <input
                type="email"
                placeholder="Optional"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                className="text-right text-sm text-neutral-400 placeholder:text-neutral-600 bg-transparent outline-none w-44"
              />
              <ChevronRight className="w-4 h-4 text-neutral-600 shrink-0" />
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-foreground font-medium">Phone Number</span>
            <button
              onClick={() => setShowPhoneInput(true)}
              className="flex items-center gap-1 text-sm text-neutral-400"
            >
              <span>{phone ? `${selectedCountry.flag} ${selectedCountry.dialCode} ${phone}` : "Optional"}</span>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
            </button>
          </div>
        </div>

        {/* Phone Number Popup */}
        {showPhoneInput && (
          <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={() => { setShowPhoneInput(false); setCountrySearch(""); }} />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm">
              {/* Close button outside top-right */}
              <button
                onClick={() => { setShowPhoneInput(false); setCountrySearch(""); }}
                className="absolute -top-3 -right-3 z-50 w-8 h-8 rounded-full bg-neutral-700 border border-neutral-600 flex items-center justify-center active:opacity-70"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
              <div className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-5 pb-3">
                  <h3 className="text-foreground font-semibold text-base mb-3">Phone Number</h3>
                  {/* Phone input row */}
                  <div className="flex items-center border border-neutral-700 rounded-xl overflow-hidden mb-3">
                    <button className="flex items-center gap-2 px-4 py-3 border-r border-neutral-700 shrink-0">
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span className="text-foreground text-sm">{selectedCountry.dialCode}</span>
                    </button>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
                      maxLength={15}
                      autoFocus
                      className="flex-1 px-3 py-3 bg-transparent text-foreground text-sm placeholder:text-neutral-600 outline-none"
                    />
                  </div>
                  {/* Search countries */}
                  <div className="flex items-center gap-2 bg-neutral-800 rounded-xl px-3 py-2.5 mb-1">
                    <Search className="w-4 h-4 text-neutral-500 shrink-0" />
                    <input
                      type="text"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder="Search country..."
                      className="flex-1 bg-transparent text-foreground text-sm placeholder:text-neutral-500 outline-none"
                    />
                  </div>
                </div>
                {/* Country list */}
                <div className="flex-1 overflow-y-auto border-t border-neutral-700/50">
                  {countryCodes
                    .filter((c) =>
                      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                      c.dialCode.includes(countrySearch) ||
                      c.code.toLowerCase().includes(countrySearch.toLowerCase())
                    )
                    .map((country) => (
                      <button
                        key={country.code}
                        onClick={() => { setSelectedCountry(country); setCountrySearch(""); }}
                        className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                          selectedCountry.code === country.code ? 'bg-neutral-700/60' : 'active:bg-neutral-800'
                        }`}
                      >
                        <span className="text-lg">{country.flag}</span>
                        <span className="text-foreground text-sm flex-1">{country.name}</span>
                        <span className="text-neutral-500 text-sm">{country.dialCode}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Employee Information */}
        <div className="mx-4 mb-1">
          <span className="text-xs text-neutral-500 font-medium tracking-wider px-1">Employee Information</span>
        </div>
        <div className="mx-4 bg-[#26262699] rounded-2xl overflow-hidden mb-4">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-700/30">
            <span className="text-sm text-foreground font-medium">Dashboard Access</span>
            <button
              onClick={() => setDashboardAccess(!dashboardAccess)}
              className={`w-12 h-7 rounded-full transition-colors ${dashboardAccess ? "bg-white" : "bg-neutral-700"} relative`}
            >
              <div className={`w-[22px] h-[22px] rounded-full absolute top-[3px] transition-transform ${dashboardAccess ? "translate-x-[22px] bg-neutral-800" : "translate-x-[3px] bg-white"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-700/30">
            <span className="text-sm text-foreground font-medium">Employee Id</span>
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="Optional"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                maxLength={20}
                className="text-right text-sm text-neutral-400 placeholder:text-neutral-600 bg-transparent outline-none w-28"
              />
              <ChevronRight className="w-4 h-4 text-neutral-600 shrink-0" />
            </div>
          </div>

          {/* Job Role */}
          <div className="relative">
            <button
              onClick={() => setShowRolePicker(true)}
              className="flex items-center justify-between w-full px-4 py-3.5 border-b border-neutral-700/30"
            >
              <span className="text-sm text-foreground font-medium">Job Role</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-neutral-400">{role || "Choose"}</span>
                <ChevronRight className="w-4 h-4 text-neutral-600" />
              </div>
            </button>
          </div>

          {/* Job Role Popup */}
          {showRolePicker && (
            <>
              <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowRolePicker(false)} />
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm">
                <button
                  onClick={() => setShowRolePicker(false)}
                  className="absolute -top-3 -right-3 z-50 w-8 h-8 rounded-full bg-neutral-700 border border-neutral-600 flex items-center justify-center active:opacity-70"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
                <div className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden p-5">
                  <h3 className="text-foreground font-semibold text-base mb-4 text-center">Select Job Role</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {roles.map((r) => (
                      <button
                        key={r}
                        onClick={() => { setRole(r); setShowRolePicker(false); }}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all min-h-[90px] justify-center ${
                          role === r
                            ? "bg-foreground/20 border border-foreground/30"
                            : "bg-foreground/5 border border-transparent active:bg-foreground/10"
                        }`}
                      >
                        {JOB_ROLE_ICONS[r] ? (
                          <img
                            src={JOB_ROLE_ICONS[r]!}
                            alt={r}
                            className="w-10 h-10"
                            style={{ filter: 'invert(1) brightness(2)' }}
                          />
                        ) : (
                          <Briefcase className="w-10 h-10 text-foreground/70" />
                        )}
                        <span className="text-foreground text-xs font-medium">{r}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Revenue Center */}
          <div className="relative">
            <button
              onClick={() => setShowRevenuePicker(true)}
              className="flex items-center justify-between w-full px-4 py-3.5 border-b border-neutral-700/30"
            >
              <span className="text-sm text-foreground font-medium">Revenue Center</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-neutral-400">{revenueCenter || "Choose"}</span>
                <ChevronRight className="w-4 h-4 text-neutral-600" />
              </div>
            </button>
          </div>

          {/* Revenue Center Popup */}
          {showRevenuePicker && (
            <>
              <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowRevenuePicker(false)} />
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm">
                <button
                  onClick={() => setShowRevenuePicker(false)}
                  className="absolute -top-3 -right-3 z-50 w-8 h-8 rounded-full bg-neutral-700 border border-neutral-600 flex items-center justify-center active:opacity-70"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
                <div className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden p-5">
                  <h3 className="text-foreground font-semibold text-base mb-4 text-center">Select Revenue Center</h3>
                  <div className="grid grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto">
                    {revenueCenters.map((rc) => {
                      const IconComp = rc === "Bar" ? Wine : rc === "Restaurant" ? UtensilsCrossed : rc === "Takeout" ? ShoppingBag : rc === "Delivery" ? Truck : rc === "Catering" ? ConciergeBell : rc === "Patio" ? Coffee : rc === "Lounge" ? Armchair : rc === "Drive-Thru" ? PartyPopper : LayoutGrid;
                      return (
                        <button
                          key={rc}
                          onClick={() => { setRevenueCenter(rc); setShowRevenuePicker(false); }}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all min-h-[90px] justify-center ${
                            revenueCenter === rc
                              ? "bg-foreground/20 border border-foreground/30"
                              : "bg-foreground/5 border border-transparent active:bg-foreground/10"
                          }`}
                        >
                          <IconComp className="w-10 h-10 text-foreground/70" />
                          <span className="text-foreground text-xs font-medium">{rc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* PIN */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-foreground font-medium">Create New Pin</span>
            <button
              onClick={() => {
                setShowPinPopup(true);
                setPinStep("new");
                setNewPinValue("");
                setConfirmPinValue("");
                setPinError("");
              }}
              className="flex items-center gap-1"
            >
              <span className="text-sm text-neutral-400">
                {pin ? "••••" : "Set PIN"}
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
            </button>
          </div>

          {/* PIN Popup */}
          {showPinPopup && (
            <>
              <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowPinPopup(false)} />
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm">
                <button
                  onClick={() => setShowPinPopup(false)}
                  className="absolute -top-3 -right-3 z-50 w-8 h-8 rounded-full bg-neutral-700 border border-neutral-600 flex items-center justify-center active:opacity-70"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
                <div className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-center relative p-4 border-b border-neutral-700/50">
                    {pinStep === "confirm" && (
                      <button
                        onClick={() => { setPinStep("new"); setConfirmPinValue(""); setPinError(""); }}
                        className="absolute left-4 w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70"
                      >
                        <ChevronLeft className="w-5 h-5 text-foreground" />
                      </button>
                    )}
                    <h2 className="text-base font-semibold text-foreground">Set PIN</h2>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col items-center pt-6 pb-4 px-4">
                    <div className="flex gap-2 mb-4">
                      {(["new", "confirm"] as const).map((s, index) => (
                        <div
                          key={s}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index <= (pinStep === "new" ? 0 : 1) ? "bg-blue-500" : "bg-neutral-600"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-neutral-400 mb-6">
                      {pinStep === "new" ? "Enter New PIN" : "Confirm New PIN"}
                    </p>
                    <div className="flex gap-4 mb-3">
                      {[0, 1, 2, 3].map((index) => {
                        const val = pinStep === "new" ? newPinValue : confirmPinValue;
                        return (
                          <div
                            key={index}
                            className={`w-3.5 h-3.5 rounded-full transition-all ${
                              val.length > index ? "bg-foreground scale-100" : "bg-neutral-700 scale-90"
                            }`}
                          />
                        );
                      })}
                    </div>
                    {pinError && <p className="text-red-400 text-xs mb-2">{pinError}</p>}
                  </div>

                  {/* Numeric Keypad */}
                  <div className="p-4 pt-0">
                    <div className="grid grid-cols-3 gap-2">
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                        <button
                          key={num}
                          onClick={() => {
                            const cur = pinStep === "new" ? newPinValue : confirmPinValue;
                            if (cur.length < 4) {
                              const next = cur + num;
                              if (pinStep === "new") setNewPinValue(next);
                              else setConfirmPinValue(next);
                              setPinError("");
                              if (next.length === 4) {
                                setTimeout(() => {
                                  if (pinStep === "new") {
                                    setPinStep("confirm");
                                  } else {
                                    if (next !== newPinValue) {
                                      setPinError("PINs do not match");
                                      setConfirmPinValue("");
                                    } else {
                                      setPin(next);
                                      setShowPinPopup(false);
                                      toast.success("PIN set successfully");
                                    }
                                  }
                                }, 200);
                              }
                            }
                          }}
                          className="h-14 bg-neutral-800/60 rounded-xl text-xl font-medium text-foreground active:bg-neutral-700 transition-colors"
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          if (pinStep === "new" && newPinValue.length > 0) setNewPinValue(newPinValue.slice(0, -1));
                          else if (pinStep === "confirm" && confirmPinValue.length > 0) setConfirmPinValue(confirmPinValue.slice(0, -1));
                          setPinError("");
                        }}
                        className="h-14 bg-neutral-800/60 rounded-xl flex items-center justify-center active:bg-neutral-700 transition-colors"
                      >
                        <Delete className="w-5 h-5 text-foreground" />
                      </button>
                      <button
                        onClick={() => {
                          const cur = pinStep === "new" ? newPinValue : confirmPinValue;
                          if (cur.length < 4) {
                            const next = cur + "0";
                            if (pinStep === "new") setNewPinValue(next);
                            else setConfirmPinValue(next);
                            setPinError("");
                            if (next.length === 4) {
                              setTimeout(() => {
                                if (pinStep === "new") {
                                  setPinStep("confirm");
                                } else {
                                  if (next !== newPinValue) {
                                    setPinError("PINs do not match");
                                    setConfirmPinValue("");
                                  } else {
                                    setPin(next);
                                    setShowPinPopup(false);
                                    toast.success("PIN set successfully");
                                  }
                                }
                              }, 200);
                            }
                          }
                        }}
                        className="h-14 bg-neutral-800/60 rounded-xl text-xl font-medium text-foreground active:bg-neutral-700 transition-colors"
                      >
                        0
                      </button>
                      <button
                        onClick={() => {
                          if (pinStep === "new") setNewPinValue("");
                          else setConfirmPinValue("");
                          setPinError("");
                        }}
                        className="h-14 bg-transparent rounded-xl text-base font-medium text-red-400 active:bg-neutral-800/40 transition-colors"
                      >
                        C
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Payroll Details */}
        <div className="mx-4 mb-1">
          <span className="text-xs text-neutral-500 font-medium tracking-wider px-1">Payroll Details</span>
        </div>
        <div className="mx-4 bg-[#26262699] rounded-2xl overflow-hidden mb-4">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-700/30">
            <span className="text-sm text-foreground font-medium">Payroll</span>
            <button
              onClick={() => setPayrollEnabled(!payrollEnabled)}
              className={`w-12 h-7 rounded-full transition-colors ${payrollEnabled ? "bg-white" : "bg-neutral-700"} relative`}
            >
              <div className={`w-[22px] h-[22px] rounded-full absolute top-[3px] transition-transform ${payrollEnabled ? "translate-x-[22px] bg-neutral-800" : "translate-x-[3px] bg-white"}`} />
            </button>
          </div>

          {/* Job Type */}
          <div className="relative">
            <button
              onClick={() => setShowJobTypePicker(true)}
              className="flex items-center justify-between w-full px-4 py-3.5 border-b border-neutral-700/30"
            >
              <span className="text-sm text-foreground font-medium">Job Type *</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-neutral-400">{jobType || "Choose"}</span>
                <ChevronRight className="w-4 h-4 text-neutral-600" />
              </div>
            </button>
          </div>

          {/* Job Type Popup */}
          {showJobTypePicker && (
            <>
              <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowJobTypePicker(false)} />
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm">
                <button
                  onClick={() => setShowJobTypePicker(false)}
                  className="absolute -top-3 -right-3 z-50 w-8 h-8 rounded-full bg-neutral-700 border border-neutral-600 flex items-center justify-center active:opacity-70"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
                <div className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden p-5">
                  <h3 className="text-foreground font-semibold text-base mb-4 text-center">Select Job Type</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {jobTypes.map((jt) => (
                      <button
                        key={jt}
                        onClick={() => { setJobType(jt); setShowJobTypePicker(false); }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all min-h-[90px] justify-center ${
                          jobType === jt
                            ? "bg-foreground/20 border border-foreground/30"
                            : "bg-foreground/5 border border-transparent active:bg-foreground/10"
                        }`}
                      >
                        <Briefcase className="w-10 h-10 text-foreground/70" />
                        <span className="text-foreground text-xs font-medium">{jt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Hourly Rate */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-foreground font-medium">Hourly Rate</span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-neutral-500">$</span>
              <input
                type="number"
                placeholder="0.00"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                min={0}
                step={0.01}
                className="text-right text-sm text-neutral-400 placeholder:text-neutral-600 bg-transparent outline-none w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <ChevronRight className="w-4 h-4 text-neutral-600 shrink-0" />
            </div>
          </div>
        </div>

        <div className="mx-4 px-1 mb-6">
          <p className="text-xs text-neutral-600 leading-relaxed">
            Manage payroll by specifying employee pay type, rates, and roles.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeContent;
