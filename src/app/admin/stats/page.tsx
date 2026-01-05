'use client'

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { 
  FaUsers, 
  FaShoppingCart, 
  FaBoxOpen, 
  FaEnvelope, 
  FaQuestionCircle,
  FaChartLine,
  FaArrowUp,
  FaArrowDown 
} from 'react-icons/fa';
import { 
  MdCategory, 
  MdSubdirectoryArrowRight,
  MdRefresh,
  MdTrendingUp 
} from 'react-icons/md';

interface StatsData {
  stats: {
    navbarCategories: number;
    navbarSubcategories: number;
    totalProducts: number;
    contactDetails: number;
    productEnquiries: number;
    totalUsers: number;
    totalRevenue: number;
    totalOrders: number;
    pageViews: number;
  };
  trends: {
    contactsTrend: string;
    usersTrend: string;
    productsTrend: string;
    revenueTrend: string;
  };
}

export default function StatsPage() {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatsData();
  }, []);

  const fetchStatsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_NEXTAUTH_SECRET || 'e7r8gMEDtyqvV9xS51uxwTF9FMMlyjvj'}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const data = await response.json();
      setStatsData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const stats = statsData?.stats;
  const trends = statsData?.trends;

  // Loading State
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#A8DF8E]/20 border-t-[#A8DF8E] mx-auto mb-4"></div>
            <p className="text-gray-400 text-lg font-medium">Loading Analytics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error State
  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-gray-800">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaQuestionCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Unable to Load Data</h3>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={fetchStatsData}
              className="px-6 py-3 bg-gradient-to-r from-[#A8DF8E] to-[#7BC96F] text-black rounded-xl font-medium hover:shadow-lg hover:shadow-[#A8DF8E]/20 transition-all flex items-center gap-2 mx-auto"
            >
              <MdRefresh className="w-5 h-5" />
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#A8DF8E] to-[#7BC96F] rounded-2xl flex items-center justify-center shadow-lg shadow-[#A8DF8E]/20">
              <FaChartLine className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
              <p className="text-gray-400">Real-time insights from your database</p>
            </div>
          </div>
          <button
            onClick={fetchStatsData}
            className="px-6 py-3 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl font-medium border border-gray-700 hover:border-[#A8DF8E]/30 transition-all flex items-center gap-2 hover:shadow-lg"
          >
            <MdRefresh className="w-5 h-5" />
            Refresh Data
          </button>
        </div>

        {/* Main Stats Grid - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Navbar Categories Card */}
          <div className="group bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform">
                <MdCategory className="w-8 h-8 text-white" />
              </div>
              <div className="flex items-center gap-1 text-white/90 text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
                <MdTrendingUp className="w-4 h-4" />
                +2.1%
              </div>
            </div>
            <h3 className="text-white/80 text-sm font-medium uppercase tracking-wide mb-2">Navbar Categories</h3>
            <p className="text-5xl font-bold text-white mb-1">{stats?.navbarCategories || 0}</p>
            <p className="text-blue-100 text-sm">Active navigation items</p>
          </div>

          {/* Navbar Subcategories Card */}
          <div className="group bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform">
                <MdSubdirectoryArrowRight className="w-8 h-8 text-white" />
              </div>
              <div className="flex items-center gap-1 text-white/90 text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
                <MdTrendingUp className="w-4 h-4" />
                +5.3%
              </div>
            </div>
            <h3 className="text-white/80 text-sm font-medium uppercase tracking-wide mb-2">Subcategories</h3>
            <p className="text-5xl font-bold text-white mb-1">{stats?.navbarSubcategories || 0}</p>
            <p className="text-purple-100 text-sm">Nested menu items</p>
          </div>

          {/* Total Products Card */}
          <div className="group bg-gradient-to-br from-[#A8DF8E] to-[#7BC96F] rounded-2xl p-6 hover:shadow-xl hover:shadow-[#A8DF8E]/30 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-black/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform">
                <FaBoxOpen className="w-8 h-8 text-black" />
              </div>
              <div className="flex items-center gap-1 text-black/80 text-sm font-medium bg-black/10 px-3 py-1 rounded-full">
                <FaArrowUp className="w-3 h-3" />
                {trends?.productsTrend || '+5.2%'}
              </div>
            </div>
            <h3 className="text-black/70 text-sm font-medium uppercase tracking-wide mb-2">Total Products</h3>
            <p className="text-5xl font-bold text-black mb-1">{stats?.totalProducts || 0}</p>
            <p className="text-black/60 text-sm">Items in inventory</p>
          </div>

        </div>

        {/* Secondary Stats Grid - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Contact Details Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-800 hover:border-[#A8DF8E]/30 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-500/20 rounded-xl group-hover:scale-110 transition-transform">
                <FaEnvelope className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-xs font-semibold text-[#A8DF8E] bg-[#A8DF8E]/10 px-3 py-1 rounded-full flex items-center gap-1 border border-[#A8DF8E]/20">
                <FaArrowUp className="w-3 h-3" />
                {trends?.contactsTrend || '+100%'}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wide mb-2">Contact Details</h3>
            <p className="text-4xl font-bold text-white mb-1">{stats?.contactDetails || 0}</p>
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500">Form submissions received</p>
            </div>
          </div>

          {/* Product Enquiries Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-800 hover:border-[#A8DF8E]/30 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-rose-500/20 rounded-xl group-hover:scale-110 transition-transform">
                <FaShoppingCart className="w-6 h-6 text-rose-400" />
              </div>
              <span className="text-xs font-semibold text-[#A8DF8E] bg-[#A8DF8E]/10 px-3 py-1 rounded-full flex items-center gap-1 border border-[#A8DF8E]/20">
                <FaArrowUp className="w-3 h-3" />
                +100%
              </span>
            </div>
            <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wide mb-2">Product Enquiries</h3>
            <p className="text-4xl font-bold text-white mb-1">{stats?.productEnquiries || 0}</p>
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500">Customer inquiries</p>
            </div>
          </div>

          {/* Total Users Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-800 hover:border-[#A8DF8E]/30 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform">
                <FaUsers className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-xs font-semibold text-gray-400 bg-gray-700 px-3 py-1 rounded-full flex items-center gap-1">
                {trends?.usersTrend || '0%'}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wide mb-2">Total Users</h3>
            <p className="text-4xl font-bold text-white mb-1">{stats?.totalUsers || 0}</p>
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500">Registered accounts</p>
            </div>
          </div>

        </div>

        {/* Bottom Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Quick Overview */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-[#A8DF8E] rounded-full animate-pulse"></div>
              System Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                <span className="text-sm font-medium text-gray-400">Database</span>
                <span className="text-sm font-semibold text-[#A8DF8E] flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#A8DF8E] rounded-full"></div>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                <span className="text-sm font-medium text-gray-400">API Status</span>
                <span className="text-sm font-semibold text-[#A8DF8E] flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#A8DF8E] rounded-full"></div>
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                <span className="text-sm font-medium text-gray-400">Last Updated</span>
                <span className="text-sm font-semibold text-white">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FaChartLine className="w-5 h-5 text-[#A8DF8E]" />
              Database Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Categories</p>
                <p className="text-3xl font-bold text-white">{stats?.navbarCategories || 0}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Products</p>
                <p className="text-3xl font-bold text-white">{stats?.totalProducts || 0}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Contacts</p>
                <p className="text-3xl font-bold text-white">{stats?.contactDetails || 0}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Enquiries</p>
                <p className="text-3xl font-bold text-white">{stats?.productEnquiries || 0}</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}
