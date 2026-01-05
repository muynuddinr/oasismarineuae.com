'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import Cookies from 'js-cookie';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaAnchor, FaShip } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { MdWaves } from 'react-icons/md';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminLoginPage() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Check if admin is already logged in
  useEffect(() => {
    const adminSession = Cookies.get('adminSession');
    if (adminSession) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Cookies.set('adminUser', credentials.email, { expires: 1 });
        
        toast.success('Login successful! Welcome Admin', {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            background: '#A8DF8E',
            color: '#000',
          }
        });

        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 2000);
      } else if (response.status === 429) {
        toast.error('Too many login attempts. Please try again later.', {
          position: "top-right",
          autoClose: 5000,
        });
      } else {
        toast.error(data.error || 'Invalid email or password', {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login. Please try again.', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <ToastContainer />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
        
        {/* Animated Circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#A8DF8E]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#A8DF8E]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-[#A8DF8E]/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(168,223,142,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,223,142,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* Floating Icons */}
        <FaShip className="absolute top-20 left-20 text-[#A8DF8E]/10 text-6xl animate-bounce" style={{ animationDuration: '3s' }} />
        <FaAnchor className="absolute bottom-32 right-24 text-[#A8DF8E]/10 text-5xl animate-bounce" style={{ animationDuration: '4s' }} />
        <MdWaves className="absolute top-40 right-32 text-[#A8DF8E]/10 text-7xl animate-bounce" style={{ animationDuration: '3.5s' }} />
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Login Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#A8DF8E]/20 overflow-hidden">
          {/* Header with Logo */}
          <div className="bg-gradient-to-r from-[#A8DF8E]/20 to-transparent p-8 border-b border-[#A8DF8E]/10">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#A8DF8E] to-[#7BC96F] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#A8DF8E]/20 transform hover:scale-105 transition-transform duration-300">
                <FaAnchor className="text-black text-3xl" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Admin Portal
              </h1>
              <p className="text-gray-400">Oasis Marine Trading LLC</p>
            </div>
          </div>

          {/* Login Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-gray-500 group-focus-within:text-[#A8DF8E] transition-colors duration-200" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={credentials.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent transition-all duration-300 hover:border-gray-600"
                    placeholder="admin@oasismarineuae.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-500 group-focus-within:text-[#A8DF8E] transition-colors duration-200" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 pr-14 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent transition-all duration-300 hover:border-gray-600"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5 text-gray-500 hover:text-[#A8DF8E] transition-colors duration-200" />
                    ) : (
                      <FaEye className="h-5 w-5 text-gray-500 hover:text-[#A8DF8E] transition-colors duration-200" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#A8DF8E] to-[#7BC96F] text-black font-bold py-4 px-6 rounded-xl hover:from-[#9BD47F] hover:to-[#6DB860] transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-[#A8DF8E]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <AiOutlineLoading3Quarters className="animate-spin text-xl" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Security Notice */}
            <div className="mt-8 pt-6 border-t border-gray-800">
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Secure encrypted connection</span>
              </div>
              <p className="text-center text-gray-600 text-xs mt-3">
                Authorized personnel only. All activities are monitored and logged.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-6">
          © 2024 Oasis Marine Trading LLC. All rights reserved.
        </p>
      </div>
    </div>
  );
}
