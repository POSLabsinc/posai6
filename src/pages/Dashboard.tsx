import BottomNavigation from "@/components/BottomNavigation";

const Dashboard = () => {
  return (
    <div className="pb-16 md:pb-0">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground mt-2">Welcome to your dashboard!</p>

      <BottomNavigation />
    </div>
  );
};

export default Dashboard;
