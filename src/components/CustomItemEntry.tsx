import { useState, useRef, useEffect } from "react";
import { Plus, DollarSign, X, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CustomItemEntryProps {
  onAddToCart: (item: { id: number; name: string; price: number }) => void;
  onCancel?: () => void;
  className?: string;
}

type ActiveField = 'name' | 'price';

const CustomItemEntry = ({ onAddToCart, onCancel, className = "" }: CustomItemEntryProps) => {
  const [itemName, setItemName] = useState("");
  const [priceValue, setPriceValue] = useState("");
  const [activeField, setActiveField] = useState<ActiveField>('name');
  const [isUpperCase, setIsUpperCase] = useState(true);

  // Parse price value to number
  const parsePrice = (value: string): number => {
    const cleanedValue = value.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleanedValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  const price = parsePrice(priceValue);
  const isValid = itemName.trim().length > 0 && price > 0;

  // Handle keyboard key press for name field
  const handleKeyboardPress = (key: string) => {
    if (key === 'backspace') {
      setItemName(prev => prev.slice(0, -1));
    } else if (key === 'space') {
      setItemName(prev => prev + ' ');
    } else if (key === 'shift') {
      setIsUpperCase(prev => !prev);
    } else if (key === 'clear') {
      setItemName('');
    } else {
      const char = isUpperCase ? key.toUpperCase() : key.toLowerCase();
      setItemName(prev => {
        // Auto-capitalize first letter
        if (prev.length === 0) {
          return char.toUpperCase();
        }
        return prev + char;
      });
      // Auto-lowercase after first character
      if (itemName.length === 0) {
        setIsUpperCase(false);
      }
    }
  };

  // Handle keypad key press for price field
  const handleKeypadPress = (key: string) => {
    if (key === 'backspace') {
      setPriceValue(prev => prev.slice(0, -1));
    } else if (key === 'clear') {
      setPriceValue('');
    } else if (key === '.') {
      // Prevent multiple decimal points
      if (!priceValue.includes('.')) {
        setPriceValue(prev => prev + '.');
      }
    } else {
      // Limit decimal places to 2
      const parts = priceValue.split('.');
      if (parts.length === 2 && parts[1].length >= 2) {
        return;
      }
      setPriceValue(prev => prev + key);
    }
  };

  const handleAddToCart = () => {
    if (!isValid) return;
    
    onAddToCart({
      id: Date.now(),
      name: itemName.trim(),
      price: price
    });
    
    // Reset form
    setItemName("");
    setPriceValue("");
    setActiveField('name');
    setIsUpperCase(true);
  };

  // Keyboard layout
  const keyboardRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
    ['123', 'space', 'clear']
  ];

  // Numeric keypad layout
  const keypadKeys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['clear', '0', '.'],
  ];

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header with back button */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-lg font-semibold text-white">Custom Item</h2>
        {onCancel && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600"
          >
            <X className="w-4 h-4 text-white" />
          </Button>
        )}
      </div>

      {/* Input Fields */}
      <div className="px-4 space-y-3">
        {/* Item Name Field */}
        <div 
          className={`flex items-center h-12 px-3 rounded-lg border-2 transition-all cursor-pointer ${
            activeField === 'name' 
              ? 'bg-neutral-700 border-orange-500' 
              : 'bg-neutral-800 border-neutral-600'
          }`}
          onClick={() => setActiveField('name')}
        >
          <span className="text-xs text-neutral-400 uppercase mr-2 w-12">Name</span>
          <span className={`flex-1 text-base ${itemName ? 'text-white' : 'text-neutral-500'}`}>
            {itemName || 'Enter Item Description'}
          </span>
        </div>

        {/* Price Field */}
        <div 
          className={`flex items-center h-12 px-3 rounded-lg border-2 transition-all cursor-pointer ${
            activeField === 'price' 
              ? 'bg-neutral-700 border-orange-500' 
              : 'bg-neutral-800 border-neutral-600'
          }`}
          onClick={() => setActiveField('price')}
        >
          <span className="text-xs text-neutral-400 uppercase mr-2 w-12">Price</span>
          <DollarSign className="w-4 h-4 text-neutral-400 mr-1" />
          <span className={`flex-1 text-base ${priceValue ? 'text-white' : 'text-neutral-500'}`}>
            {priceValue || '0.00'}
          </span>
        </div>
      </div>

      {/* Add to Order Button */}
      <div className="px-4 py-3">
        <Button
          onClick={handleAddToCart}
          disabled={!isValid}
          className="w-full h-11 rounded-full text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: isValid 
              ? 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' 
              : 'linear-gradient(180deg, #555555 0%, #333333 100%)'
          }}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add to Order
          {price > 0 && (
            <span className="ml-2">${price.toFixed(2)}</span>
          )}
        </Button>
      </div>

      {/* Keyboard / Keypad Area */}
      <div className="flex-1 min-h-0 bg-neutral-800 rounded-t-2xl p-2 mt-auto overflow-hidden">
        {activeField === 'name' ? (
          /* Alphanumeric Keyboard */
          <div className="flex flex-col gap-1 h-full">
            {keyboardRows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 justify-center flex-1">
                {row.map((key) => {
                  const isSpecialKey = ['shift', 'backspace', 'space', 'clear', '123'].includes(key);
                  const displayKey = key === 'space' ? 'Space' : 
                                    key === 'shift' ? (isUpperCase ? '⇧' : '⇪') :
                                    key === 'backspace' ? '⌫' :
                                    key === 'clear' ? 'Clear' :
                                    key === '123' ? '123' :
                                    isUpperCase ? key.toUpperCase() : key;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        if (key === '123') {
                          setActiveField('price');
                        } else {
                          handleKeyboardPress(key);
                        }
                      }}
                      className={`rounded-lg flex items-center justify-center font-medium transition-all active:scale-95 ${
                        key === 'space' 
                          ? 'flex-[3] bg-neutral-700 hover:bg-neutral-600 text-white text-sm' 
                          : key === 'shift'
                          ? `w-12 ${isUpperCase ? 'bg-orange-500 text-white' : 'bg-neutral-700 text-white'} hover:bg-neutral-600 text-lg`
                          : key === 'backspace'
                          ? 'w-12 bg-neutral-700 hover:bg-neutral-600 text-white text-lg'
                          : key === 'clear'
                          ? 'flex-1 bg-red-500/80 hover:bg-red-500 text-white text-sm'
                          : key === '123'
                          ? 'flex-1 bg-neutral-700 hover:bg-neutral-600 text-white text-sm'
                          : 'flex-1 bg-neutral-700 hover:bg-neutral-600 text-white text-base md:text-lg'
                      }`}
                    >
                      {key === 'backspace' ? <Delete className="w-5 h-5" /> : displayKey}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          /* Numeric Keypad */
          <div className="grid grid-cols-3 gap-2 h-full">
            {keypadKeys.flat().map((key) => (
              <button
                key={key}
                onClick={() => {
                  if (key === 'clear') {
                    handleKeypadPress('clear');
                  } else {
                    handleKeypadPress(key);
                  }
                }}
                className={`rounded-xl flex items-center justify-center text-xl md:text-2xl font-semibold transition-all active:scale-95 ${
                  key === 'clear'
                    ? 'bg-red-500/80 hover:bg-red-500 text-white text-sm'
                    : 'bg-neutral-700 hover:bg-neutral-600 text-white'
                }`}
              >
                {key === 'clear' ? 'Clear' : key}
              </button>
            ))}
            {/* Backspace button spanning full row */}
            <button
              onClick={() => handleKeypadPress('backspace')}
              className="col-span-3 h-12 rounded-xl bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-all active:scale-95"
            >
              <Delete className="w-6 h-6 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomItemEntry;
