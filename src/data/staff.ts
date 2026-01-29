export interface StaffMember {
  id: number;
  name: string;
  initials: string;
  avatar?: string;
  role: 'Server' | 'Manager' | 'Host' | 'Admin';
}

export const staffList: StaffMember[] = [
  { id: 1, name: "Account Admin", initials: "AA", role: "Admin" },
  { id: 2, name: "Rohan Yadav", initials: "RY", role: "Server" },
  { id: 3, name: "Mia Jones", initials: "MJ", role: "Server" },
  { id: 4, name: "Dustin H", initials: "DH", role: "Server" },
  { id: 5, name: "Alex M", initials: "AM", role: "Server" },
  { id: 6, name: "Sarah Wilson", initials: "SW", role: "Host" },
  { id: 7, name: "James Rodriguez", initials: "JR", role: "Manager" },
];
