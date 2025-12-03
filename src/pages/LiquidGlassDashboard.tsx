import { TrendingUp, ShoppingBag, Users, DollarSign, ArrowUpRight, Clock, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const stats = [
  { label: "Revenue", value: "$12,450", change: "+12.5%", icon: DollarSign, color: "from-orange-500 to-amber-400" },
  { label: "Orders", value: "284", change: "+8.2%", icon: ShoppingBag, color: "from-blue-500 to-cyan-400" },
  { label: "Customers", value: "1,429", change: "+23.1%", icon: Users, color: "from-purple-500 to-pink-400" },
  { label: "Avg Order", value: "$43.82", change: "+5.4%", icon: TrendingUp, color: "from-emerald-500 to-teal-400" },
];

const recentOrders = [
  { id: "#4521", customer: "Sarah M.", amount: "$67.50", time: "2 min ago", status: "preparing" },
  { id: "#4520", customer: "John D.", amount: "$34.20", time: "5 min ago", status: "ready" },
  { id: "#4519", customer: "Emily R.", amount: "$89.00", time: "8 min ago", status: "delivered" },
  { id: "#4518", customer: "Michael K.", amount: "$45.75", time: "12 min ago", status: "delivered" },
  { id: "#4517", customer: "Lisa P.", amount: "$123.00", time: "15 min ago", status: "delivered" },
];

const quickActions = [
  { label: "New Order", icon: ShoppingBag },
  { label: "Add Customer", icon: Users },
  { label: "View Reports", icon: TrendingUp },
  { label: "AI Insights", icon: Sparkles },
];

export default function LiquidGlassDashboard() {
  return (
    <div className="min-h-screen bg-neutral-950 gradient-mesh">
      <ScrollArea className="h-screen">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-light text-white tracking-tight">Dashboard</h1>
              <p className="text-neutral-400 mt-1">Welcome back. Here's what's happening today.</p>
            </div>
            <div className="glass-vibrant rounded-2xl px-4 py-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-white text-sm">Live</span>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="glass-vibrant rounded-3xl p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300"
              >
                {/* Gradient Orb Background */}
                <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br ${stat.color} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity`} />
                
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-neutral-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-semibold text-white mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 text-sm">{stat.change}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Orders */}
            <div className="lg:col-span-2 glass-dark rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium text-white">Recent Orders</h2>
                <button className="glass rounded-xl px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors">
                  View All
                </button>
              </div>
              
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="glass rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">{order.customer.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{order.customer}</p>
                        <p className="text-neutral-400 text-sm">{order.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{order.amount}</p>
                      <p className="text-neutral-500 text-xs">{order.time}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'preparing' ? 'bg-amber-500/20 text-amber-400' :
                      order.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {order.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-dark rounded-3xl p-6">
              <h2 className="text-xl font-medium text-white mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    className="glass-vibrant rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:scale-[1.05] hover:glass-glow transition-all duration-300"
                  >
                    <action.icon className="w-8 h-8 text-orange-400" />
                    <span className="text-white text-sm font-medium">{action.label}</span>
                  </button>
                ))}
              </div>

              {/* Mini Chart Placeholder */}
              <div className="mt-6 glass rounded-2xl p-4">
                <p className="text-neutral-400 text-sm mb-3">Today's Peak Hours</p>
                <div className="flex items-end gap-1 h-20">
                  {[40, 65, 85, 95, 75, 60, 45, 70, 90, 80, 55, 35].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-orange-500 to-amber-400 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-neutral-500 text-xs">9AM</span>
                  <span className="text-neutral-500 text-xs">9PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
