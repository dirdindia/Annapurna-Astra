import { Building2, Users, DollarSign, Activity, TrendingUp, Sparkles, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../api';
import moment from 'moment';
import MagneticButton from '../components/MagneticButton';

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

  const COLORS = ['#0F4B4A', '#F2A33A', '#10B981', '#438D87', '#D98A1F'];

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
    { name: 'Total Hotels', value: dashboardData.totalHotels || 0, icon: <Building2 className="w-5 h-5 text-white" />, change: 'All time', color: 'from-lagoon-700 to-lagoon-900', shadow: 'shadow-lagoon-900/20' },
    { name: 'Active Subscriptions', value: dashboardData.activeSubscriptions || 0, icon: <Activity className="w-5 h-5 text-white" />, change: 'Active now', color: 'from-emerald-600 to-teal-700', shadow: 'shadow-emerald-600/20' },
    { name: 'Total Revenue', value: `₹${(dashboardData.totalRevenue || 0).toLocaleString('en-IN')}`, icon: <DollarSign className="w-5 h-5 text-white" />, change: 'Total collected', color: 'from-saffron-500 to-amber-600', shadow: 'shadow-saffron-500/20' },
    { name: 'Registered Users', value: dashboardData.totalUsers || 0, icon: <Users className="w-5 h-5 text-white" />, change: 'Hotel staff & admins', color: 'from-cyan-600 to-blue-700', shadow: 'shadow-cyan-600/20' },
  ];

  return (
    <div className="pb-8 space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-lagoon-100/90 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-saffron-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-saffron-500/15 text-saffron-700 border border-saffron-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cloud Network Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-lagoon-950 tracking-tight">
            Centralized Hotel Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Real-time multi-tenant analytics, subscription revenue metrics, and property health monitoring.
          </p>
        </div>
      </div>
      
      {/* Metrics Grid */}
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
            transition={{ delay: index * 0.08 }}
            className="group bg-white p-6 rounded-3xl shadow-sm border border-lagoon-100/80 hover:shadow-xl hover:shadow-lagoon-900/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
          >
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}></div>
            
            <div className="flex items-center gap-3.5 mb-4">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} shadow-md ${stat.shadow}`}>
                {stat.icon}
              </div>
              <h3 className="text-xs font-bold text-slate-600 tracking-wider uppercase">{stat.name}</h3>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">{stat.value}</p>
              <span className="text-[11px] font-bold text-lagoon-700 bg-lagoon-50 border border-lagoon-200/60 px-2 py-0.5 rounded-lg">
                {stat.change}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Area Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-lagoon-100/80"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display font-bold text-lagoon-950 tracking-tight">Revenue Over Time</h3>
              <p className="text-xs text-slate-500 font-medium">Last 6 months SaaS recurring billing</p>
            </div>
            <span className="text-xs font-bold text-saffron-700 bg-saffron-50 border border-saffron-200 px-2.5 py-1 rounded-xl">
              INR (₹)
            </span>
          </div>
          <div className="h-[280px] w-full">
            {dashboardData.revenueByMonth?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.revenueByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F4B4A" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0F4B4A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF3F1" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    cursor={{ stroke: '#0F4B4A', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #CFE3DF', boxShadow: '0 10px 25px -5px rgb(10 47 47 / 0.1)', fontWeight: 'bold' }}
                    itemStyle={{ color: '#0F4B4A' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#0F4B4A" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400 font-medium text-xs">Not enough data to display chart</div>
            )}
          </div>
        </motion.div>

        {/* Plan Distribution Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-lagoon-100/80"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display font-bold text-lagoon-950 tracking-tight">Subscription Plans</h3>
              <p className="text-xs text-slate-500 font-medium">Distribution across active hotels</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
              Active Tier Ratio
            </span>
          </div>
          <div className="h-[280px] w-full">
            {dashboardData.planDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dashboardData.planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid #CFE3DF', boxShadow: '0 10px 25px -5px rgb(10 47 47 / 0.1)' }}
                    itemStyle={{ color: '#0A2F2F', fontWeight: 'bold' }}
                    formatter={(value, name) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs font-bold text-slate-700 capitalize">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400 font-medium text-xs">No active subscriptions found</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Hotels Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl shadow-sm border border-lagoon-100/80 overflow-hidden"
      >
        <div className="p-6 sm:p-8 border-b border-lagoon-100/80 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-display font-bold text-lagoon-950 tracking-tight">Recent Hotels</h3>
            <p className="text-xs text-slate-500 font-medium">Newly onboarded properties on E-Annapurna Cloud</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-lagoon-50/70 border-b border-lagoon-100/80">
              <tr>
                <th className="text-left py-4 px-6 sm:px-8 text-xs font-bold text-lagoon-800 uppercase tracking-wider">Hotel Name</th>
                <th className="text-left py-4 px-6 sm:px-8 text-xs font-bold text-lagoon-800 uppercase tracking-wider">Plan</th>
                <th className="text-left py-4 px-6 sm:px-8 text-xs font-bold text-lagoon-800 uppercase tracking-wider">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dashboardData.recentHotels?.length > 0 ? (
                dashboardData.recentHotels.map((hotel) => (
                  <tr key={hotel._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 sm:px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lagoon-50 to-lagoon-100 border border-lagoon-200 flex items-center justify-center text-lagoon-700 font-black shadow-sm text-sm">
                          {hotel.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900 text-sm">{hotel.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 sm:px-8">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                        hotel.subscriptionPlan === 'pro' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        hotel.subscriptionPlan === 'premium' ? 'bg-saffron-50 text-saffron-700 border border-saffron-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {hotel.subscriptionPlan || 'Free'}
                      </span>
                    </td>
                    <td className="py-4 px-6 sm:px-8 text-xs font-semibold text-slate-500">
                      {moment(hotel.createdAt).format('MMM DD, YYYY')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="py-8 text-center text-slate-400 font-medium text-xs">No recent hotels found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
