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
  { id: "1", name: "John Smith", phone: "(555) 123-4567", email: "john@example.com", lastOrderDate: "2026-01-15", orderCount: 12 },
  { id: "2", name: "Jane Doe", phone: "(555) 987-6543", email: "jane@example.com", lastOrderDate: "2026-01-18", orderCount: 5 },
  { id: "3", name: "Mike Johnson", phone: "(555) 456-7890", email: "mike@example.com", lastOrderDate: "2026-01-10", orderCount: 8 },
  { id: "4", name: "Sarah Williams", phone: "(555) 321-0987", email: "sarah@example.com", lastOrderDate: "2026-01-20", orderCount: 3 },
  { id: "5", name: "Alexander Johnson", phone: "(897) 654-3210", email: "alexander.johnson@gmail.com", lastOrderDate: "2026-01-19", orderCount: 15 },
  { id: "6", name: "Emily Chen", phone: "(555) 222-3344", email: "emily.chen@gmail.com", lastOrderDate: "2026-02-10", orderCount: 22 },
  { id: "7", name: "Robert Garcia", phone: "(555) 444-5566", email: "r.garcia@yahoo.com", lastOrderDate: "2026-02-05", orderCount: 7 },
  { id: "8", name: "Priya Patel", phone: "(555) 666-7788", email: "priya.patel@outlook.com", lastOrderDate: "2026-01-28", orderCount: 31 },
  { id: "9", name: "David Kim", phone: "(555) 888-9900", email: "david.kim@example.com", lastOrderDate: "2026-02-18", orderCount: 4 },
  { id: "10", name: "Maria Rodriguez", phone: "(555) 111-2233", email: "maria.r@hotmail.com", lastOrderDate: "2026-02-12", orderCount: 9 },
  { id: "11", name: "James Wilson", phone: "(555) 333-4455", email: "j.wilson@example.com", lastOrderDate: "2026-01-25", orderCount: 16 },
  { id: "12", name: "Aisha Mohammed", phone: "(555) 555-6677", email: "aisha.m@gmail.com", lastOrderDate: "2026-02-20", orderCount: 2 },
  { id: "13", name: "Tom Bradley", phone: "(555) 777-8899", email: "tom.bradley@example.com", lastOrderDate: "2026-02-14", orderCount: 11 },
  { id: "14", name: "Lisa Nguyen", phone: "(555) 999-0011", email: "lisa.nguyen@outlook.com", lastOrderDate: "2026-01-30", orderCount: 19 },
  { id: "15", name: "Carlos Mendez", phone: "(555) 112-2334", email: "carlos.m@yahoo.com", lastOrderDate: "2026-02-08", orderCount: 6 },
  { id: "16", name: "Sophie Turner", phone: "(555) 334-4556", email: "sophie.t@gmail.com", lastOrderDate: "2026-02-22", orderCount: 28 },
  { id: "17", name: "Ahmed Hassan", phone: "(555) 556-6778", email: "ahmed.h@example.com", lastOrderDate: "2026-01-12", orderCount: 14 },
  { id: "18", name: "Rachel Green", phone: "(555) 778-8990", email: "rachel.g@hotmail.com", lastOrderDate: "2026-02-01", orderCount: 10 },
  { id: "19", name: "Kevin O'Brien", phone: "(555) 990-0112", email: "kevin.ob@gmail.com", lastOrderDate: "2026-02-16", orderCount: 1 },
  { id: "20", name: "Yuki Tanaka", phone: "(555) 213-3445", email: "yuki.tanaka@outlook.com", lastOrderDate: "2026-02-23", orderCount: 35 },
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
