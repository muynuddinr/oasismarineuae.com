'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import { 
  MdDashboard, 
  MdMenu, 
  MdClose, 
  MdLogout,
  MdBarChart,
  MdInventory,
  MdContacts,
  MdNavigation,
  MdExpandMore,
  MdExpandLess
} from 'react-icons/md';
import { FaAnchor, FaEnvelope, FaShip } from 'react-icons/fa';
import { HiOutlineMenuAlt3 } from 'react-icons/hi';
import Image from 'next/image';
import 'react-toastify/dist/ReactToastify.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const sidebarItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: MdDashboard },
  { name: 'Navbar', href: '/admin/navbar', icon: MdNavigation },
  { name: 'Products', href: '/admin/products', icon: MdInventory },
  { name: 'Product Enquiry', href: '/admin/contacts', icon: MdContacts },
  { name: 'Contact Details', href: '/admin/conatcts-details', icon: FaEnvelope },
  { name: 'Statistics', href: '/admin/stats', icon: MdBarChart }
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [adminUser, setAdminUser] = useState('Admin');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const adminUsername = Cookies.get('adminUser');
    if (adminUsername) {
      setAdminUser(adminUsername);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      Cookies.remove('adminSession');
      Cookies.remove('adminUser');
      Cookies.remove('auth-token');
      setAdminUser('Admin');
      
      toast.success('Logged out successfully!', {
        position: "top-right",
        autoClose: 1500,
        style: {
          background: '#A8DF8E',
          color: '#000',
        }
      });
      
      setTimeout(() => {
        router.push('/admin');
      }, 1500);
    }
  };

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex h-screen bg-gray-950">
      <ToastContainer />
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-20' : 'w-72'} bg-black transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-gray-800`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-20 px-4 border-b border-gray-800 bg-gradient-to-r from-[#A8DF8E]/10 to-transparent">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center w-full' : 'space-x-3'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-[#A8DF8E] to-[#7BC96F] rounded-xl flex items-center justify-center shadow-lg shadow-[#A8DF8E]/20">
              <FaAnchor className="text-black text-lg" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-white">Oasis Marine</h1>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="hidden lg:block text-gray-500 hover:text-[#A8DF8E] transition-colors"
              >
                <MdExpandLess className="h-5 w-5 rotate-90" />
              </button>
            )}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <MdClose className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Expand Button when collapsed */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:flex w-full justify-center py-4 text-gray-500 hover:text-[#A8DF8E] transition-colors border-b border-gray-800"
          >
            <MdExpandMore className="h-5 w-5 -rotate-90" />
          </button>
        )}

        {/* Admin Info */}
        {!sidebarCollapsed && (
          <div className="px-4 py-4 border-b border-gray-800">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-900/50">
              <div className="w-12 h-12 bg-gradient-to-br from-[#A8DF8E] to-[#7BC96F] rounded-xl flex items-center justify-center">
                <span className="text-black font-bold text-lg">
                  {adminUser.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">Administrator</p>
                <p className="text-gray-500 text-sm truncate">{adminUser}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="mt-4 px-3 flex-1">
          <p className={`text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 ${sidebarCollapsed ? 'text-center' : 'px-3'}`}>
            {sidebarCollapsed ? '•••' : 'Navigation'}
          </p>
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-[#A8DF8E] to-[#7BC96F] text-black shadow-lg shadow-[#A8DF8E]/20'
                        : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                    }`}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isActive(item.href) ? '' : 'group-hover:text-[#A8DF8E]'}`} />
                    {!sidebarCollapsed && (
                      <span className="font-medium">{item.name}</span>
                    )}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 border border-gray-800">
                        {item.name}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-3 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200 group`}
            title={sidebarCollapsed ? 'Logout' : undefined}
          >
            <MdLogout className="h-5 w-5 group-hover:text-red-400" />
            {!sidebarCollapsed && (
              <span className="font-medium">Sign Out</span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-black/50 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-40">
          <div className="flex items-center justify-between h-20 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-[#A8DF8E] p-2 rounded-xl hover:bg-gray-900 transition-all"
              >
                <HiOutlineMenuAlt3 className="h-6 w-6" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {sidebarItems.find(item => isActive(item.href))?.name || 'Dashboard'}
                </h2>
                <p className="text-gray-500 text-sm">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-900 rounded-xl border border-gray-800">
                <div className="w-2 h-2 bg-[#A8DF8E] rounded-full animate-pulse" />
                <span className="text-sm text-gray-400">
                  Logged in as <span className="text-white font-medium">{adminUser}</span>
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all duration-200 border border-red-500/20"
              >
                <MdLogout className="h-5 w-5" />
                <span className="hidden sm:inline font-medium">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
