import { useState } from "react";
import { CreditCard, Smartphone, Building, Check, ArrowRight, ShieldCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const orderItems = [
  { name: "Margherita Pizza", qty: 1, price: 18.99, image: "🍕" },
  { name: "Truffle Pasta", qty: 2, price: 24.99, image: "🍝" },
  { name: "Tiramisu", qty: 1, price: 9.99, image: "🍰" },
  { name: "Espresso Martini", qty: 2, price: 14.99, image: "☕" },
];

const paymentMethods = [
  { id: "card", name: "Credit Card", icon: CreditCard, description: "Visa, Mastercard, Amex" },
  { id: "apple", name: "Apple Pay", icon: Smartphone, description: "Pay with Face ID" },
  { id: "cash", name: "Cash", icon: Building, description: "Pay at counter" },
];

const steps = ["Order Summary", "Payment", "Confirmation"];

export default function LiquidGlassCheckout() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState("card");

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 gradient-mesh flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, idx) => (
            <div key={step} className="flex items-center">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    idx <= currentStep
                      ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white"
                      : "glass text-neutral-500"
                  }`}
                >
                  {idx < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="font-medium">{idx + 1}</span>
                  )}
                </div>
                <span className={`text-sm font-medium ${idx <= currentStep ? "text-white" : "text-neutral-500"}`}>
                  {step}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-24 h-0.5 mx-4 rounded-full transition-colors ${
                  idx < currentStep ? "bg-gradient-to-r from-orange-500 to-amber-400" : "bg-neutral-800"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="glass-dark rounded-[2rem] p-8 relative overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl" />
          
          {currentStep === 0 && (
            <div className="relative z-10">
              <h2 className="text-2xl font-medium text-white mb-6">Order Summary</h2>
              
              <ScrollArea className="h-64 mb-6">
                <div className="space-y-3 pr-4">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="glass rounded-2xl p-4 flex items-center gap-4">
                      <span className="text-3xl">{item.image}</span>
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-neutral-400 text-sm">Qty: {item.qty}</p>
                      </div>
                      <span className="text-white font-semibold">${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Totals */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Tax (10%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="h-px bg-white/10 my-3" />
                <div className="flex justify-between">
                  <span className="text-white font-medium">Total</span>
                  <span className="text-2xl font-semibold text-white">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={nextStep}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-2xl py-4 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Continue to Payment <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {currentStep === 1 && (
            <div className="relative z-10">
              <h2 className="text-2xl font-medium text-white mb-6">Payment Method</h2>
              
              <div className="space-y-4 mb-8">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`w-full glass rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 ${
                      selectedPayment === method.id
                        ? "ring-2 ring-orange-500/50 bg-orange-500/10"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedPayment === method.id
                        ? "bg-gradient-to-r from-orange-500 to-amber-400"
                        : "glass"
                    }`}>
                      <method.icon className={`w-6 h-6 ${selectedPayment === method.id ? "text-white" : "text-neutral-400"}`} />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white font-medium">{method.name}</p>
                      <p className="text-neutral-400 text-sm">{method.description}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedPayment === method.id
                        ? "border-orange-500 bg-orange-500"
                        : "border-neutral-600"
                    }`}>
                      {selectedPayment === method.id && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                ))}
              </div>

              {/* Card Input (shown only for card payment) */}
              {selectedPayment === "card" && (
                <div className="glass-vibrant rounded-2xl p-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-neutral-400 text-sm mb-2 block">Card Number</label>
                      <input
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        className="w-full glass rounded-xl px-4 py-3 bg-transparent text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-orange-500/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-neutral-400 text-sm mb-2 block">Expiry</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full glass rounded-xl px-4 py-3 bg-transparent text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-orange-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-neutral-400 text-sm mb-2 block">CVC</label>
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full glass rounded-xl px-4 py-3 bg-transparent text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-orange-500/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-neutral-400 text-sm mb-6">
                <ShieldCheck className="w-4 h-4" />
                <span>Your payment information is encrypted and secure</span>
              </div>

              <button
                onClick={nextStep}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-2xl py-4 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Pay ${total.toFixed(2)} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="relative z-10 text-center py-8">
              {/* Success Animation */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 mx-auto mb-6 flex items-center justify-center animate-scale-in">
                <Check className="w-12 h-12 text-white" />
              </div>
              
              <h2 className="text-3xl font-medium text-white mb-2">Payment Successful!</h2>
              <p className="text-neutral-400 mb-8">Your order has been placed and is being prepared</p>

              <div className="glass-vibrant rounded-2xl p-6 mb-8 max-w-sm mx-auto">
                <p className="text-neutral-400 text-sm mb-1">Order Number</p>
                <p className="text-2xl font-semibold text-white">#4522</p>
                <p className="text-neutral-400 text-sm mt-4">Estimated time</p>
                <p className="text-xl font-medium text-orange-400">15-20 minutes</p>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setCurrentStep(0)}
                  className="glass rounded-2xl px-6 py-3 text-white font-medium hover:bg-white/10 transition-colors"
                >
                  New Order
                </button>
                <button className="bg-gradient-to-r from-orange-500 to-amber-400 rounded-2xl px-6 py-3 text-white font-medium hover:opacity-90 transition-opacity">
                  Track Order
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
