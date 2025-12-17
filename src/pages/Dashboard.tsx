import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShoppingBag,
  Clock,
  ChefHat,
  Utensils
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeDropdown } from "@/components/theme/ThemeSelector";

const Dashboard = () => {
  return (
    <div className="h-full overflow-auto bg-background p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's an overview of today's activity.</p>
        </div>
        <ThemeDropdown />
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$4,235.89</div>
            <p className="text-xs text-success flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +20.1% from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders Today</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">142</div>
            <p className="text-xs text-success flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12% from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Tables</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">18/24</div>
            <p className="text-xs text-muted-foreground">
              6 available
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">12 min</div>
            <p className="text-xs text-success flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              -3 min from average
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Kitchen Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="text-foreground">Orders in Queue</span>
              <span className="text-xl font-bold text-warning">8</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="text-foreground">Being Prepared</span>
              <span className="text-xl font-bold text-info">5</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="text-foreground">Ready for Pickup</span>
              <span className="text-xl font-bold text-success">3</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff on Duty
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="text-foreground">Servers</span>
              <span className="text-xl font-bold text-foreground">6</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="text-foreground">Kitchen Staff</span>
              <span className="text-xl font-bold text-foreground">4</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="text-foreground">Host</span>
              <span className="text-xl font-bold text-foreground">1</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
