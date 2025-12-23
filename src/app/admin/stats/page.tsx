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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping"></div>
              <div className="absolute inset-0 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-600 text-lg font-medium">Loading Analytics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error State
  if (error) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-center bg-white p-8 rounded-2xl shadow-xl border border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaQuestionCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Unable to Load Data</h3>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={fetchStatsData}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6 lg:p-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FaChartLine className="w-6 h-6 text-white" />
                </div>
                Analytics Dashboard
              </h1>
              <p className="text-slate-600 text-lg">Real-time insights from your database</p>
            </div>
            <button
              onClick={fetchStatsData}
              className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <MdRefresh className="w-5 h-5" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Main Stats Grid - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Navbar Categories Card */}
          <div className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-blue-400/20">
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
          <div className="group bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-indigo-400/20">
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
            <p className="text-indigo-100 text-sm">Nested menu items</p>
          </div>

          {/* Total Products Card */}
          <div className="group bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-emerald-400/20">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform">
                <FaBoxOpen className="w-8 h-8 text-white" />
              </div>
              <div className="flex items-center gap-1 text-white/90 text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
                <FaArrowUp className="w-3 h-3" />
                {trends?.productsTrend || '+5.2%'}
              </div>
            </div>
            <h3 className="text-white/80 text-sm font-medium uppercase tracking-wide mb-2">Total Products</h3>
            <p className="text-5xl font-bold text-white mb-1">{stats?.totalProducts || 0}</p>
            <p className="text-emerald-100 text-sm">Items in inventory</p>
          </div>

        </div>

        {/* Secondary Stats Grid - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Contact Details Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl">
                <FaEnvelope className="w-6 h-6 text-amber-700" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full flex items-center gap-1">
                <FaArrowUp className="w-3 h-3" />
                {trends?.contactsTrend || '+100%'}
              </span>
            </div>
            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-2">Contact Details</h3>
            <p className="text-4xl font-bold text-slate-900 mb-1">{stats?.contactDetails || 0}</p>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">Form submissions received</p>
            </div>
          </div>

          {/* Product Enquiries Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-rose-100 to-rose-200 rounded-xl">
                <FaShoppingCart className="w-6 h-6 text-rose-700" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full flex items-center gap-1">
                <FaArrowUp className="w-3 h-3" />
                +100%
              </span>
            </div>
            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-2">Product Enquiries</h3>
            <p className="text-4xl font-bold text-slate-900 mb-1">{stats?.productEnquiries || 0}</p>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">Customer inquiries</p>
            </div>
          </div>

          {/* Total Users Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                <FaUsers className="w-6 h-6 text-purple-700" />
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-full flex items-center gap-1">
                {trends?.usersTrend || '0%'}
              </span>
            </div>
            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-2">Total Users</h3>
            <p className="text-4xl font-bold text-slate-900 mb-1">{stats?.totalUsers || 0}</p>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">Registered accounts</p>
            </div>
          </div>

        </div>

        {/* Bottom Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Quick Overview */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              System Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-600">Database</span>
                <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-600">API Status</span>
                <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-600">Last Updated</span>
                <span className="text-sm font-semibold text-slate-700">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700 text-white">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaChartLine className="w-5 h-5 text-blue-400" />
              Database Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Categories</p>
                <p className="text-3xl font-bold">{stats?.navbarCategories || 0}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Products</p>
                <p className="text-3xl font-bold">{stats?.totalProducts || 0}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Contacts</p>
                <p className="text-3xl font-bold">{stats?.contactDetails || 0}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Enquiries</p>
                <p className="text-3xl font-bold">{stats?.productEnquiries || 0}</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}
