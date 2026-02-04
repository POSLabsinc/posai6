import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, User, Phone, Mail, Users, Clock, Gift, Building, MapPin, CreditCard, Utensils, Baby, Accessibility, Bell, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Reservation } from "@/components/ReservationsPanel";

interface EditReservationDialogProps {
  reservation: Reservation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedReservation: Reservation) => void;
  availableTables: { id: string; seats: number }[];
}

// Time options for the picker
const timeOptions = [
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
  "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM"
];

// Duration options
const durationOptions = ["1 hour", "1.5 hours", "2 hours", "2.5 hours", "3 hours", "3.5 hours", "4 hours"];

// Occasion options
const occasionOptions = ["None", "Birthday", "Anniversary", "Business", "Date Night", "Celebration", "Other"];

// Service type options
const serviceTypeOptions = ["Dine-In", "Private Dining", "Outdoor", "Bar Seating"];

// Source options
const sourceOptions = ["Walk-in", "Phone", "OpenTable", "Resy", "Yelp", "Website", "Google", "Other"];

// Floor options
const floorOptions = ["Main Floor", "Upper Level", "Patio", "Private Room", "Bar Area"];

// Area options
const areaOptions = ["Dining Room", "Window Section", "Bar Area", "Outdoor Patio", "Private Room", "Booth Section"];

export const EditReservationDialog = ({
  reservation,
  open,
  onOpenChange,
  onSave,
  availableTables,
}: EditReservationDialogProps) => {
  // Form state
  const [formData, setFormData] = useState<Reservation>(reservation);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Reset form when reservation changes
  useEffect(() => {
    setFormData(reservation);
  }, [reservation]);

  const handleInputChange = (field: keyof Reservation, value: string | number | boolean | Date | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Combine first and last name for guestName
    const updatedReservation: Reservation = {
      ...formData,
      guestName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || formData.guestName,
    };
    onSave(updatedReservation);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-neutral-900 border-neutral-800 text-white overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-neutral-800">
          <DialogTitle className="text-lg font-semibold text-white">Edit Reservation</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="guest-info" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start rounded-none border-b border-neutral-800 bg-neutral-900/50 h-auto p-0 px-4">
            <TabsTrigger 
              value="guest-info" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-neutral-400 px-4 py-3 text-sm"
            >
              Guest Info
            </TabsTrigger>
            <TabsTrigger 
              value="sitting" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-neutral-400 px-4 py-3 text-sm"
            >
              Sitting
            </TabsTrigger>
            <TabsTrigger 
              value="payment" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-neutral-400 px-4 py-3 text-sm"
            >
              Payment
            </TabsTrigger>
            <TabsTrigger 
              value="other" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-neutral-400 px-4 py-3 text-sm"
            >
              Other
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 max-h-[60vh]">
            {/* Guest Info Tab */}
            <TabsContent value="guest-info" className="p-6 space-y-5 mt-0">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    First Name
                  </Label>
                  <Input
                    value={formData.firstName || ""}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-sm">Last Name</Label>
                  <Input
                    value={formData.lastName || ""}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    placeholder="Last name"
                  />
                </div>
              </div>

              {/* Contact Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-sm flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </Label>
                  <Input
                    value={formData.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    placeholder="(555) 555-1234"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    placeholder="guest@email.com"
                  />
                </div>
              </div>

              {/* Party Size & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Party Size
                  </Label>
                  <Select
                    value={formData.partySize.toString()}
                    onValueChange={(value) => handleInputChange("partySize", parseInt(value))}
                  >
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue placeholder="Select party size" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((size) => (
                        <SelectItem key={size} value={size.toString()} className="text-white hover:bg-neutral-700">
                          {size} {size === 1 ? "Guest" : "Guests"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Time
                  </Label>
                  <Select
                    value={formData.time}
                    onValueChange={(value) => handleInputChange("time", value)}
                  >
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700 max-h-[200px]">
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time} className="text-white hover:bg-neutral-700">
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-sm flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Date
                  </Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.date, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-700" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => {
                          if (date) {
                            handleInputChange("date", date);
                            setIsCalendarOpen(false);
                          }
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duration
                  </Label>
                  <Select
                    value={formData.duration || ""}
                    onValueChange={(value) => handleInputChange("duration", value)}
                  >
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      {durationOptions.map((duration) => (
                        <SelectItem key={duration} value={duration} className="text-white hover:bg-neutral-700">
                          {duration}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Occasion */}
              <div className="space-y-2">
                <Label className="text-neutral-400 text-sm flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Occasion
                </Label>
                <Select
                  value={formData.occasion || "None"}
                  onValueChange={(value) => handleInputChange("occasion", value === "None" ? "" : value)}
                >
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Select occasion" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {occasionOptions.map((occasion) => (
                      <SelectItem key={occasion} value={occasion} className="text-white hover:bg-neutral-700">
                        {occasion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Guest Notes */}
              <div className="space-y-2">
                <Label className="text-neutral-400 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Guest Notes
                </Label>
                <Textarea
                  value={formData.guestNotes || ""}
                  onChange={(e) => handleInputChange("guestNotes", e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white min-h-[80px]"
                  placeholder="Notes about the guest..."
                />
              </div>
            </TabsContent>

            {/* Sitting Tab */}
            <TabsContent value="sitting" className="p-6 space-y-5 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-sm flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Floor
                  </Label>
                  <Select
                    value={formData.floor || ""}
                    onValueChange={(value) => handleInputChange("floor", value)}
                  >
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue placeholder="Select floor" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      {floorOptions.map((floor) => (
                        <SelectItem key={floor} value={floor} className="text-white hover:bg-neutral-700">
                          {floor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Area
                  </Label>
                  <Select
                    value={formData.area || ""}
                    onValueChange={(value) => handleInputChange("area", value)}
                  >
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      {areaOptions.map((area) => (
                        <SelectItem key={area} value={area} className="text-white hover:bg-neutral-700">
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Table Assignment */}
              <div className="space-y-2">
                <Label className="text-neutral-400 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Assigned Table
                </Label>
                <Select
                  value={formData.tableId || "unassigned"}
                  onValueChange={(value) => handleInputChange("tableId", value === "unassigned" ? null : value)}
                >
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="unassigned" className="text-white hover:bg-neutral-700">
                      Unassigned
                    </SelectItem>
                    {availableTables.map((table) => (
                      <SelectItem key={table.id} value={table.id} className="text-white hover:bg-neutral-700">
                        Table {table.id} ({table.seats} seats)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment" className="p-6 space-y-5 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Deposit Amount
                  </Label>
                  <Input
                    type="number"
                    value={formData.depositAmount || ""}
                    onChange={(e) => handleInputChange("depositAmount", e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-sm">Payment Status</Label>
                  <Select
                    value={formData.paymentStatus || ""}
                    onValueChange={(value) => handleInputChange("paymentStatus", value)}
                  >
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      <SelectItem value="Not Required" className="text-white hover:bg-neutral-700">Not Required</SelectItem>
                      <SelectItem value="Pending" className="text-white hover:bg-neutral-700">Pending</SelectItem>
                      <SelectItem value="Deposit Received" className="text-white hover:bg-neutral-700">Deposit Received</SelectItem>
                      <SelectItem value="Paid in Full" className="text-white hover:bg-neutral-700">Paid in Full</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-neutral-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-neutral-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Deposit Paid</p>
                    <p className="text-neutral-500 text-xs">Mark if deposit has been collected</p>
                  </div>
                </div>
                <Switch
                  checked={formData.depositPaid || false}
                  onCheckedChange={(checked) => handleInputChange("depositPaid", checked)}
                />
              </div>
            </TabsContent>

            {/* Other Tab */}
            <TabsContent value="other" className="p-6 space-y-5 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-sm flex items-center gap-2">
                    <Utensils className="w-4 h-4" />
                    Service Type
                  </Label>
                  <Select
                    value={formData.serviceType || ""}
                    onValueChange={(value) => handleInputChange("serviceType", value)}
                  >
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      {serviceTypeOptions.map((type) => (
                        <SelectItem key={type} value={type} className="text-white hover:bg-neutral-700">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-sm">Reservation Source</Label>
                  <Select
                    value={formData.reservationSource || ""}
                    onValueChange={(value) => handleInputChange("reservationSource", value)}
                  >
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      {sourceOptions.map((source) => (
                        <SelectItem key={source} value={source} className="text-white hover:bg-neutral-700">
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-sm">Assigned Server</Label>
                  <Input
                    value={formData.assignedServer || ""}
                    onChange={(e) => handleInputChange("assignedServer", e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    placeholder="Server name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-sm">Confirmation Number</Label>
                  <Input
                    value={formData.confirmationNumber || ""}
                    onChange={(e) => handleInputChange("confirmationNumber", e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    placeholder="Confirmation #"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-400 text-sm">External Reference</Label>
                <Input
                  value={formData.externalReference || ""}
                  onChange={(e) => handleInputChange("externalReference", e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white"
                  placeholder="External reference ID"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-400 text-sm flex items-center gap-2">
                  <Utensils className="w-4 h-4" />
                  Dietary Restrictions
                </Label>
                <Input
                  value={formData.dietaryRestrictions || ""}
                  onChange={(e) => handleInputChange("dietaryRestrictions", e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white"
                  placeholder="e.g., Gluten-free, Vegan, Nut allergy"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-sm flex items-center gap-2">
                    <Baby className="w-4 h-4" />
                    High Chairs Needed
                  </Label>
                  <Select
                    value={(formData.highChairCount ?? 0).toString()}
                    onValueChange={(value) => handleInputChange("highChairCount", parseInt(value))}
                  >
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue placeholder="Select count" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      {[0, 1, 2, 3, 4].map((count) => (
                        <SelectItem key={count} value={count.toString()} className="text-white hover:bg-neutral-700">
                          {count}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-sm flex items-center gap-2">
                    <Baby className="w-4 h-4" />
                    Kids Count
                  </Label>
                  <Select
                    value={(formData.kidsCount ?? 0).toString()}
                    onValueChange={(value) => handleInputChange("kidsCount", parseInt(value))}
                  >
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue placeholder="Select count" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      {[0, 1, 2, 3, 4, 5, 6].map((count) => (
                        <SelectItem key={count} value={count.toString()} className="text-white hover:bg-neutral-700">
                          {count}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-400 text-sm flex items-center gap-2">
                  <Accessibility className="w-4 h-4" />
                  Accessibility Requirements
                </Label>
                <Input
                  value={formData.accessibilityRequirements || ""}
                  onChange={(e) => handleInputChange("accessibilityRequirements", e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white"
                  placeholder="e.g., Wheelchair accessible, Service animal"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-400 text-sm">Visit Notes</Label>
                <Textarea
                  value={formData.visitNotes || ""}
                  onChange={(e) => handleInputChange("visitNotes", e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white min-h-[80px]"
                  placeholder="Notes for this visit..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-400 text-sm">Special Requests</Label>
                <Textarea
                  value={formData.specialRequests || ""}
                  onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white min-h-[80px]"
                  placeholder="Special requests from the guest..."
                />
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-neutral-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-neutral-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Reminders Enabled</p>
                    <p className="text-neutral-500 text-xs">Send confirmation reminders</p>
                  </div>
                </div>
                <Switch
                  checked={formData.remindersEnabled || false}
                  onCheckedChange={(checked) => handleInputChange("remindersEnabled", checked)}
                />
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-neutral-800 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-orange-600 hover:bg-orange-500 text-white"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};