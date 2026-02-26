// Centralized customer data store for phone conflict detection

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  linkedProfiles?: string[]; // Family member IDs
  lastOrderDate?: string;
  orderCount?: number;
}

// Mock customers database
export const customers: Customer[] = [
  { 
    id: "1", 
    name: "John Smith", 
    phone: "(555) 123-4567", 
    email: "john@example.com",
    lastOrderDate: "2026-01-15",
    orderCount: 12
  },
  { 
    id: "2", 
    name: "Jane Doe", 
    phone: "(555) 987-6543", 
    email: "jane@example.com",
    lastOrderDate: "2026-01-18",
    orderCount: 5
  },
  { 
    id: "3", 
    name: "Mike Johnson", 
    phone: "(555) 456-7890", 
    email: "mike@example.com",
    lastOrderDate: "2026-01-10",
    orderCount: 8
  },
  { 
    id: "4", 
    name: "Sarah Williams", 
    phone: "(555) 321-0987", 
    email: "sarah@example.com",
    lastOrderDate: "2026-01-20",
    orderCount: 3
  },
  { 
    id: "5", 
    name: "Alexander Johnson", 
    phone: "(897) 654-3210", 
    email: "alexander.johnson@gmail.com",
    lastOrderDate: "2026-01-19",
    orderCount: 15
  },
];

/**
 * Find a customer by phone number
 */
export const findCustomerByPhone = (phone: string): Customer | undefined => {
  const cleanPhone = phone.replace(/\D/g, "");
  return customers.find(
    (customer) => customer.phone.replace(/\D/g, "") === cleanPhone
  );
};

/**
 * Check if there's a phone conflict - phone exists but with a different name
 * Returns the existing customer if conflict found, null otherwise
 */
export const checkPhoneConflict = (phone: string, name: string): Customer | null => {
  const cleanPhone = phone.replace(/\D/g, "");
  
  // Only check when we have a complete phone number (10 digits)
  if (cleanPhone.length !== 10) return null;
  
  const existingCustomer = findCustomerByPhone(cleanPhone);
  
  if (!existingCustomer) return null;
  
  // Check if names are different (case-insensitive comparison)
  const existingNameNormalized = existingCustomer.name.toLowerCase().trim();
  const newNameNormalized = name.toLowerCase().trim();
  
  if (existingNameNormalized !== newNameNormalized && name.trim() !== "") {
    return existingCustomer;
  }
  
  return null;
};

/**
 * Search customers by name or phone
 */
export const searchCustomers = (query: string): Customer[] => {
  if (!query.trim()) return [];
  
  const normalizedQuery = query.toLowerCase();
  const cleanQuery = query.replace(/\D/g, "");
  
  return customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(normalizedQuery) ||
      customer.phone.replace(/\D/g, "").includes(cleanQuery)
  );
};
