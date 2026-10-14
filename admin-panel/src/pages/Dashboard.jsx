import { Building2, Users, DollarSign, Activity, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../api';
import moment from 'moment';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalHotels: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    totalUsers: 0,
    recentHotels: [],
    planDistribution: [],
    revenueByMonth: []
  });

  const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/superadmin/dashboard-stats');
        setDashboardData(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { name: 'Total Hotels', value: dashboardData.totalHotels || 0, icon: <Building2 className="w-6 h-6 text-white" />, change: 'All time', color: 'from-blue-500 to-blue-600' },
    { name: 'Active Subscriptions', value: dashboardData.activeSubscriptions || 0, icon: <Activity className="w-6 h-6 text-white" />, change: 'Active now', color: 'from-emerald-500 to-emerald-600' },
    { name: 'Total Revenue', value: `₹${(dashboardData.totalRevenue || 0).toLocaleString('en-IN')}`, icon: <DollarSign className="w-6 h-6 text-white" />, change: 'Total collected', color: 'from-violet-500 to-violet-600' },
    { name: 'Total Users', value: dashboardData.totalUsers || 0, icon: <Users className="w-6 h-6 text-white" />, change: 'Registered users', color: 'from-amber-500 to-amber-600' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-lagoon-900 to-lagoon-500 tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 mt-2 font-medium">Here is what is happening with your hotels today.</p>
      </div>
      
      <div className="space-y-8 animate-fade-in">
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
          >
            {/* Ambient background glow */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}></div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg shadow-blue-500/20`}>
                {stat.icon}
              </div>
              <h3 className="text-sm font-medium text-slate-500 tracking-wide uppercase">{stat.name}</h3>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-display font-semibold text-slate-900 tracking-tight">{stat.value}</p>
              <span className="text-xs font-medium text-slate-500 bg-slate-100/50 px-2 py-1 rounded-lg">
                {stat.change}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50"
        >
          <h3 className="text-xl font-display font-semibold text-slate-900 mb-8 tracking-tight">Revenue Over Time (Last 6 Months)</h3>
          <div className="h-[300px] w-full">
            {dashboardData.revenueByMonth?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.revenueByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    cursor={{ stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                    itemStyle={{ color: '#4f46e5' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400 font-medium">Not enough data to display chart</div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50"
        >
          <h3 className="text-xl font-display font-semibold text-slate-900 mb-8 tracking-tight">Subscription Plans</h3>
          <div className="h-[300px] w-full">
            {dashboardData.planDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dashboardData.planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                    formatter={(value, name) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-sm font-medium text-slate-700 capitalize">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400 font-medium">No active subscriptions found</div>
            )}
          </div>
        </motion.div>
      </div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 overflow-hidden"
      >
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-display font-semibold text-slate-900 tracking-tight">Recent Hotels</h3>
          <button className="text-sm font-semibold text-lagoon-600 hover:text-lagoon-700 hover:bg-lagoon-50 px-4 py-2 rounded-xl transition-colors">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="text-left py-4 px-6 sm:px-8 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hotel Name</th>
                <th className="text-left py-4 px-6 sm:px-8 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                <th className="text-left py-4 px-6 sm:px-8 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {dashboardData.recentHotels?.length > 0 ? (
                dashboardData.recentHotels.map((hotel) => (
                  <tr key={hotel._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 sm:px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-semibold shadow-sm">
                          {hotel.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-900">{hotel.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 sm:px-8">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        hotel.subscriptionPlan === 'pro' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                        hotel.subscriptionPlan === 'premium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {hotel.subscriptionPlan || 'Free'}
                      </span>
                    </td>
                    <td className="py-4 px-6 sm:px-8 text-sm font-medium text-slate-500">
                      {moment(hotel.createdAt).format('MMM DD, YYYY')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="py-8 text-center text-slate-400 font-medium">No recent hotels found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
