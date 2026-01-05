'use client'

import React, { useEffect, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { 
  MdPeople, 
  MdInventory, 
  MdContacts, 
  MdTrendingUp,
  MdVisibility,
  MdEmail,
  MdCategory,
  MdShoppingBag,
  MdRefresh
} from 'react-icons/md';
import { FaAnchor, FaShip, FaBox, FaEnvelope, FaChartBar } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
}

const StatCard = ({ title, value, icon: Icon, trend, trendUp = true, loading }: StatCardProps) => (
  <div className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-800 hover:border-[#A8DF8E]/30 transition-all duration-300 overflow-hidden">
    {/* Glow effect on hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#A8DF8E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    <div className="relative flex items-start justify-between">
      <div className="flex-1">
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        {loading ? (
          <div className="h-9 w-24 bg-gray-700 rounded animate-pulse" />
        ) : (
          <p className="text-3xl font-bold text-white">{value}</p>
        )}
        {trend && (
          <p className={`text-sm mt-2 flex items-center gap-1 ${trendUp ? 'text-[#A8DF8E]' : 'text-red-400'}`}>
            <MdTrendingUp className={`${!trendUp && 'rotate-180'}`} />
            {trend}
          </p>
        )}
      </div>
      <div className="w-14 h-14 bg-gradient-to-br from-[#A8DF8E]/20 to-[#A8DF8E]/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <Icon className="h-7 w-7 text-[#A8DF8E]" />
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    subcategories: 0,
    contacts: 0,
    enquiries: 0
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        if (response.ok) {
          const data = await response.json();
          setStats({
            products: data.products || 0,
            categories: data.categories || 0,
            subcategories: data.subcategories || 0,
            contacts: data.contacts || 0,
            enquiries: data.enquiries || 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const syncStats = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/admin/stats/recalculate', {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.stats) {
          setStats({
            products: data.stats.total_products || 0,
            categories: data.stats.total_categories || 0,
            subcategories: data.stats.total_subcategories || 0,
            contacts: data.stats.total_contacts || 0,
            enquiries: data.stats.total_enquiries || 0
          });
        }
      }
    } catch (error) {
      console.error('Failed to sync stats:', error);
    } finally {
      setSyncing(false);
    }
  };

  const quickActions = [
    { name: 'Add Product', href: '/admin/products', icon: FaBox, color: 'from-[#A8DF8E] to-[#7BC96F]' },
    { name: 'View Enquiries', href: '/admin/contacts', icon: FaEnvelope, color: 'from-blue-500 to-blue-600' },
    { name: 'Manage Navbar', href: '/admin/navbar', icon: MdCategory, color: 'from-purple-500 to-purple-600' },
    { name: 'View Statistics', href: '/admin/stats', icon: FaChartBar, color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-800 overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#A8DF8E]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#A8DF8E]/5 rounded-full blur-2xl" />
          <FaShip className="absolute right-8 bottom-8 text-[#A8DF8E]/10 text-8xl" />
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#A8DF8E] to-[#7BC96F] rounded-2xl flex items-center justify-center shadow-lg shadow-[#A8DF8E]/20">
                <FaAnchor className="text-black text-2xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-bold text-white">Welcome back!</h1>
                  <HiSparkles className="text-[#A8DF8E] text-2xl" />
                </div>
                <p className="text-gray-400">
                  Manage your Oasis Marine Trading platform from this control panel
                </p>
              </div>
            </div>
            
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl px-6 py-4 border border-gray-700">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Current Time</p>
              <p className="text-2xl font-bold text-white font-mono">
                {currentTime.toLocaleTimeString()}
              </p>
              <p className="text-[#A8DF8E] text-sm">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MdTrendingUp className="text-[#A8DF8E]" />
              Overview Statistics
            </h2>
            <button
              onClick={syncStats}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-[#A8DF8E]/30 rounded-xl text-sm text-gray-300 hover:text-white transition-all duration-200 disabled:opacity-50"
            >
              <MdRefresh className={`text-[#A8DF8E] ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Stats'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Products"
              value={stats.products}
              icon={MdInventory}
              trend="+12% this month"
              loading={loading}
            />
            <StatCard
              title="Categories"
              value={stats.categories}
              icon={MdCategory}
              loading={loading}
            />
            <StatCard
              title="Subcategories"
              value={stats.subcategories}
              icon={MdShoppingBag}
              loading={loading}
            />
            <StatCard
              title="Product Enquiries"
              value={stats.enquiries}
              icon={MdEmail}
              trend="+8% this week"
              loading={loading}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <HiSparkles className="text-[#A8DF8E]" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.name}
                  href={action.href}
                  className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-800 hover:border-[#A8DF8E]/30 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#A8DF8E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex flex-col items-center text-center">
                    <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-white font-medium">{action.name}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* System Status */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <MdVisibility className="text-[#A8DF8E]" />
            System Status
          </h2>
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-[#A8DF8E]/10 rounded-2xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-[#A8DF8E] rounded-full animate-pulse" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#A8DF8E] rounded-full border-2 border-gray-800" />
                </div>
                <div>
                  <p className="text-white font-semibold">Server Status</p>
                  <p className="text-[#A8DF8E] text-sm">Online & Running</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full animate-pulse" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-gray-800" />
                </div>
                <div>
                  <p className="text-white font-semibold">Database</p>
                  <p className="text-blue-400 text-sm">Supabase Connected</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-purple-500 rounded-full animate-pulse" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full border-2 border-gray-800" />
                </div>
                <div>
                  <p className="text-white font-semibold">API Services</p>
                  <p className="text-purple-400 text-sm">All Systems Go</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}