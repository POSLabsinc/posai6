import { createContext, useContext, useState, type ReactNode } from "react";

interface VoucherModeContextType {
  isVoucherMode: boolean;
  setIsVoucherMode: (v: boolean) => void;
}

const VoucherModeContext = createContext<VoucherModeContextType>({
  isVoucherMode: false,
  setIsVoucherMode: () => {},
});

export const useVoucherMode = () => useContext(VoucherModeContext);

export function VoucherModeProvider({ children }: { children: ReactNode }) {
  const [isVoucherMode, setIsVoucherMode] = useState(false);
  return (
    <VoucherModeContext.Provider value={{ isVoucherMode, setIsVoucherMode }}>
      {children}
    </VoucherModeContext.Provider>
  );
}
