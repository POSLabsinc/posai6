import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, ArrowUpDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import BottomNavigation from "@/components/BottomNavigation";

// Mock all orders data from different tables
const allOrders = [
  { id: "3", name: "Martin Alex", table: "T2", amount: "$24.00", partySize: 4, time: "10:00 PM", status: "ORDERING" },
  { id: "8", name: "Guest", table: "T3", amount: "$16.00", partySize: 2, time: "10:00 PM", status: "ORDERING" },
  { id: "7", name: "Smith", table: "T4", amount: "$85.00", partySize: 3, time: "8:30 PM", status: "ORDERING" },
  { id: "6", name: "Johnson", table: "T1", amount: "$20.00", partySize: 1, time: "7:35 PM", status: "PREPARING" },
  { id: "5", name: "Williams", table: "T5", amount: "$120.75", partySize: 4, time: "7:30 PM", status: "ORDERED" },
  { id: "4", name: "Brown", table: "T6", amount: "$65.50", partySize: 2, time: "7:15 PM", status: "PREPARING" },
];

const mergeFilters = ["All", "Ordering", "Ordered", "Preparing"];

type MergeStep = "select" | "confirm-direction" | "final-confirm";

const MergeOrders = () => {
  const navigate = useNavigate();
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  
  const [step, setStep] = useState<MergeStep>("select");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [fromOrder, setFromOrder] = useState<typeof allOrders[0] | null>(null);
  const [toOrder, setToOrder] = useState<typeof allOrders[0] | null>(null);

  // Get the current order being merged (from the table we came from)
  const currentOrder = allOrders.find(o => o.id === orderId) || allOrders[0];

  // Filter orders excluding the current order
  const availableOrders = allOrders.filter(o => o.id !== orderId);

  const filteredOrders = activeFilter === "All" 
    ? availableOrders 
    : availableOrders.filter(o => o.status === activeFilter.toUpperCase());

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ORDERING": return "text-red-500";
      case "ORDERED": return "text-orange-500";
      case "PREPARING": return "text-yellow-500";
      case "COMPLETED": return "text-green-500";
      default: return "text-white/60";
    }
  };

  const handleOrderSelect = (order: typeof allOrders[0]) => {
    if (selectedOrders.includes(order.id)) {
      setSelectedOrders(selectedOrders.filter(id => id !== order.id));
    } else {
      setSelectedOrders([...selectedOrders, order.id]);
    }
  };

  const handleProceedToDirection = () => {
    if (selectedOrders.length > 0) {
      const selectedOrder = allOrders.find(o => o.id === selectedOrders[0]);
      if (selectedOrder) {
        setFromOrder(selectedOrder);
        setToOrder(currentOrder);
        setStep("confirm-direction");
      }
    }
  };

  const handleSwapDirection = () => {
    const temp = fromOrder;
    setFromOrder(toOrder);
    setToOrder(temp);
  };

  const handleConfirmDirection = () => {
    setStep("final-confirm");
  };

  const handleFinalConfirm = () => {
    // Navigate back to table details with merged order info
    navigate(`/tableorder/${tableId}?merged=${selectedOrders.join(",")}&from=${fromOrder?.id}`);
  };

  const handleBack = () => {
    if (step === "confirm-direction") {
      setStep("select");
    } else if (step === "final-confirm") {
      setStep("confirm-direction");
    } else {
      navigate(`/tableorder/${tableId}`);
    }
  };

  const getFilterCount = (filter: string) => {
    if (filter === "All") return availableOrders.length;
    return availableOrders.filter(o => o.status === filter.toUpperCase()).length;
  };

  // Render order card
  const OrderCard = ({ order, isSelected, onClick, showCheckbox = true }: { 
    order: typeof allOrders[0]; 
    isSelected: boolean; 
    onClick?: () => void;
    showCheckbox?: boolean;
  }) => (
    <div 
      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
        isSelected ? "bg-neutral-700 border border-white" : "bg-neutral-800 border border-transparent"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {showCheckbox && (
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            isSelected ? "border-orange-500 bg-orange-500" : "border-white/40"
          }`}>
            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm">{order.id}</span>
          <span className="text-white font-medium">{order.name}</span>
          <span className="text-white/60">·</span>
          <span className="text-white/80">{order.table}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-white font-medium">{order.amount}</span>
        <span className={`text-xs font-medium ${getStatusColor(order.status)}`}>{order.status}</span>
      </div>
    </div>
  );

  // Render order info row
  const OrderInfoRow = ({ order }: { order: typeof allOrders[0] }) => (
    <div className="text-white/60 text-xs flex items-center gap-2 mt-1">
      <span>Party of {order.partySize},</span>
      <span className="flex items-center gap-1">
        <span>⚡</span>
        {order.time}
      </span>
    </div>
  );

  // Step 1: Select orders to merge
  const SelectOrdersView = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button 
          onClick={handleBack}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ 
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
          }}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white text-xl font-medium flex-1 text-center pr-10">Merge</h1>
      </div>

      {/* Current Order */}
      <div className="px-4 pb-2">
        <OrderCard order={currentOrder} isSelected={true} showCheckbox={false} />
        <OrderInfoRow order={currentOrder} />
      </div>

      {/* Choose Orders Label */}
      <div className="px-4 py-2">
        <p className="text-white/80 text-sm">Choose Orders to Merge with Order {orderId}</p>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 flex-wrap">
          {mergeFilters.map(filter => {
            const count = getFilterCount(filter);
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive ? "text-black" : "text-white"
                }`}
                style={isActive ? {
                  background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
                } : {
                  background: "#7575754D",
                  boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
                }}
              >
                {filter}
                <span className={`font-bold ${isActive ? "text-black" : "text-white"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      <ScrollArea className="flex-1 px-4">
        <div className="flex flex-col gap-2 pb-4">
          {filteredOrders.map(order => (
            <div key={order.id}>
              <OrderCard 
                order={order} 
                isSelected={selectedOrders.includes(order.id)}
                onClick={() => handleOrderSelect(order)}
              />
              <OrderInfoRow order={order} />
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Merge Button */}
      {selectedOrders.length > 0 && (
        <div className="p-4 pb-20 md:pb-4">
          <button
            onClick={handleProceedToDirection}
            className="w-full py-3 rounded-full text-black font-medium"
            style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
          >
            MERGE ORDER {orderId}, {selectedOrders.join(", ")}
          </button>
        </div>
      )}
    </div>
  );

  // Step 2: Confirm direction (From/To)
  const ConfirmDirectionView = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button 
          onClick={handleBack}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ 
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
          }}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white text-xl font-medium flex-1 text-center pr-10">Merge</h1>
      </div>

      {/* Selected Orders Info */}
      <div className="px-4 pb-2">
        <OrderCard order={currentOrder} isSelected={true} showCheckbox={false} />
        <OrderInfoRow order={currentOrder} />
      </div>

      <div className="px-4 py-2">
        <p className="text-white/80 text-sm">
          Merge {selectedOrders.length} order from {fromOrder?.table}
        </p>
        <p className="text-white/60 text-xs mt-1">
          Choose Orders to Merge with Order {orderId}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 flex-wrap">
          {mergeFilters.map(filter => {
            const count = getFilterCount(filter);
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive ? "text-black" : "text-white"
                }`}
                style={isActive ? {
                  background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
                } : {
                  background: "#7575754D",
                  boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
                }}
              >
                {filter}
                <span className={`font-bold ${isActive ? "text-black" : "text-white"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Order in list */}
      <div className="px-4 flex-1">
        {fromOrder && (
          <div className="mb-4">
            <OrderCard order={fromOrder} isSelected={true} />
            <OrderInfoRow order={fromOrder} />
          </div>
        )}
      </div>

      {/* Merge Button */}
      <div className="p-4 pb-20 md:pb-4">
        <button
          onClick={handleConfirmDirection}
          className="w-full py-3 rounded-full text-black font-medium"
          style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
        >
          MERGE ORDER {orderId}, {selectedOrders.join(", ")}
        </button>
      </div>
    </div>
  );

  // Step 3: Final confirmation with From/To swap
  const FinalConfirmView = () => (
    <div className="flex flex-col h-full">
      {/* Grabber */}
      <div className="flex justify-center pt-2 pb-4">
        <div className="w-10 h-1 bg-white/30 rounded-full" />
      </div>

      {/* From Section */}
      <div className="px-4 pb-4">
        <p className="text-white/60 text-sm mb-2">From</p>
        {fromOrder && (
          <div>
            <OrderCard order={fromOrder} isSelected={false} showCheckbox={false} />
            <OrderInfoRow order={fromOrder} />
          </div>
        )}
      </div>

      {/* Swap Button */}
      <div className="flex justify-center py-4">
        <button 
          onClick={handleSwapDirection}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-neutral-800 border border-white/20"
        >
          <ArrowUpDown className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* To Section */}
      <div className="px-4 pb-4">
        <p className="text-white/60 text-sm mb-2">To</p>
        {toOrder && (
          <div>
            <OrderCard order={toOrder} isSelected={false} showCheckbox={false} />
            <OrderInfoRow order={toOrder} />
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Confirm Button */}
      <div className="p-4 pb-20 md:pb-4">
        <button
          onClick={handleFinalConfirm}
          className="w-full py-3 rounded-full text-black font-medium"
          style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
        >
          CONFIRM
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-black">
      {step === "select" && <SelectOrdersView />}
      {step === "confirm-direction" && <ConfirmDirectionView />}
      {step === "final-confirm" && <FinalConfirmView />}
      
      {/* Bottom Navigation - Mobile only */}
      <div className="md:hidden">
        <BottomNavigation />
      </div>
    </div>
  );
};

export default MergeOrders;
