'use client'

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { 
  FaEnvelope, 
  FaPhone, 
  FaUser, 
  FaCalendarAlt, 
  FaReply, 
  FaTrash, 
  FaEye,
  FaFilter,
  FaSearch,
  FaDownload
} from 'react-icons/fa';
import { 
  MdMarkEmailRead, 
  MdMarkEmailUnread,
  MdSubject,
  MdMessage 
} from 'react-icons/md';
import { ExclamationTriangleIcon, EnvelopeIcon, UserIcon, PhoneIcon, ClockIcon } from '@heroicons/react/24/outline';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  priority: 'low' | 'medium' | 'high';
  source: 'contact_form' | 'product_inquiry';
  createdAt: string;
  updatedAt: string;
  repliedAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

export default function ContactDetailsPage() {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Fetch contact form submissions
  useEffect(() => {
    fetchContactSubmissions();
  }, []);

  const fetchContactSubmissions = async () => {
    try {
      console.log('Fetching contact submissions...')
      const response = await fetch('/api/contact-submissions');
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json();
        console.log('Received contact submissions:', data)
        setContacts(data);
        setError('');
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData)
        setError(`Failed to fetch contact submissions: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error fetching contact submissions:', error);
      setError('Network error while fetching contact submissions');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || contact.status === statusFilter;
    const matchesSource = sourceFilter === '' || contact.source === sourceFilter;
    
    let matchesDate = true;
    if (dateFilter) {
      const contactDate = new Date(contact.createdAt).toDateString();
      const filterDate = new Date(dateFilter).toDateString();
      matchesDate = contactDate === filterDate;
    }
    
    return matchesSearch && matchesStatus && matchesSource && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'read':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'replied':
        return 'bg-[#A8DF8E]/20 text-[#A8DF8E] border border-[#A8DF8E]/30';
      default:
        return 'bg-gray-700 text-gray-300 border border-gray-600';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'contact_form':
        return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      case 'product_inquiry':
        return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
      default:
        return 'bg-gray-700 text-gray-300 border border-gray-600';
    }
  };

  const updateContactStatus = async (id: string, status: 'new' | 'read' | 'replied') => {
    try {
      const response = await fetch(`/api/contact-submissions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchContactSubmissions(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating contact status:', error);
    }
  };

  const deleteContact = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this contact submission?')) {
      try {
        const response = await fetch(`/api/contact-submissions/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchContactSubmissions(); // Refresh the list
          setSelectedContact(null);
        }
      } catch (error) {
        console.error('Error deleting contact:', error);
      }
    }
  };

  const exportContacts = () => {
    const csvContent = [
      ['Name', 'Email', 'Subject', 'Message', 'Status', 'Source', 'Date'],
      ...filteredContacts.map(contact => [
        contact.name,
        contact.email,
        contact.subject,
        contact.message,
        contact.status,
        contact.source,
        new Date(contact.createdAt).toLocaleString()
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contact-submissions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#A8DF8E]/20 border-t-[#A8DF8E]"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-red-400">Error</h3>
              <p className="mt-2 text-gray-400">{error}</p>
              <button 
                onClick={fetchContactSubmissions}
                className="mt-4 bg-gradient-to-r from-[#A8DF8E] to-[#7BC96F] text-black px-6 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-[#A8DF8E]/20 transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#A8DF8E] to-[#7BC96F] rounded-2xl flex items-center justify-center">
              <FaEnvelope className="text-black text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Contact Form Submissions</h1>
              <p className="text-gray-400">
                Manage contact form submissions from /contact page
              </p>
            </div>
          </div>
          <button
            onClick={exportContacts}
            className="flex items-center px-5 py-2.5 bg-gradient-to-r from-[#A8DF8E] to-[#7BC96F] text-black rounded-xl font-medium hover:shadow-lg hover:shadow-[#A8DF8E]/20 transition-all"
          >
            <FaDownload className="mr-2" />
            Export CSV
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 border border-gray-800 hover:border-[#A8DF8E]/30 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase">Total</p>
                <p className="text-2xl font-bold text-white mt-1">{contacts.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <EnvelopeIcon className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 border border-gray-800 hover:border-[#A8DF8E]/30 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase">New</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {contacts.filter(c => c.status === 'new').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <MdMarkEmailUnread className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 border border-gray-800 hover:border-[#A8DF8E]/30 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase">Replied</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {contacts.filter(c => c.status === 'replied').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-[#A8DF8E]/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <MdMarkEmailRead className="h-5 w-5 text-[#A8DF8E]" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 border border-gray-800 hover:border-[#A8DF8E]/30 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase">Contact</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {contacts.filter(c => c.source === 'contact_form').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaUser className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 border border-gray-800 hover:border-[#A8DF8E]/30 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase">Today</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {contacts.filter(c => 
                    new Date(c.createdAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaCalendarAlt className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <FaSearch className="inline mr-2 text-gray-500" />
                Search Submissions
              </label>
              <input
                type="text"
                placeholder="Search by name, email, subject, or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <FaFilter className="inline mr-2 text-gray-500" />
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent transition-all"
              >
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filter by Source
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent transition-all"
              >
                <option value="">All Sources</option>
                <option value="contact_form">Contact Form</option>
                <option value="product_inquiry">Product Inquiry</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filter by Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Contact Submissions List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submissions List */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">
                Submissions ({filteredContacts.length})
              </h2>
            </div>

            <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {contacts.length === 0 ? 'No contact submissions found' : 'No submissions match your filters'}
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`p-5 cursor-pointer transition-all ${
                      selectedContact?.id === contact.id 
                        ? 'bg-[#A8DF8E]/10 border-l-4 border-[#A8DF8E]' 
                        : 'hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <h3 className="text-sm font-medium text-white">{contact.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-lg ${getStatusColor(contact.status)}`}>
                            {contact.status}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-lg ${getSourceColor(contact.source)}`}>
                            {contact.source.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-1">{contact.email}</p>
                        <p className="text-sm font-medium text-gray-300 mb-1 truncate">{contact.subject}</p>
                        <p className="text-xs text-gray-500 mb-1 line-clamp-2">{contact.message}</p>
                        <p className="text-xs text-gray-600">{formatDate(contact.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Submission Details */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Submission Details</h2>
            </div>

            {selectedContact ? (
              <div className="p-6 space-y-6">
                {/* Contact Info */}
                <div>
                  <h3 className="text-sm font-medium text-[#A8DF8E] mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <UserIcon className="h-4 w-4 text-gray-500 mr-3" />
                      <span className="font-medium text-gray-300">{selectedContact.name}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <EnvelopeIcon className="h-4 w-4 text-gray-500 mr-3" />
                      <a href={`mailto:${selectedContact.email}`} className="text-[#A8DF8E] hover:underline">
                        {selectedContact.email}
                      </a>
                    </div>
                    <div className="flex items-center text-sm">
                      <ClockIcon className="h-4 w-4 text-gray-500 mr-3" />
                      <span className="text-gray-300">{formatDate(selectedContact.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <h3 className="text-sm font-medium text-[#A8DF8E] mb-3">
                    <MdSubject className="inline mr-2" />
                    Subject
                  </h3>
                  <p className="text-sm text-gray-300 bg-gray-800/50 p-4 rounded-xl">
                    {selectedContact.subject}
                  </p>
                </div>

                {/* Message */}
                <div>
                  <h3 className="text-sm font-medium text-[#A8DF8E] mb-3">
                    <MdMessage className="inline mr-2" />
                    Message
                  </h3>
                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {selectedContact.message}
                    </p>
                  </div>
                </div>

                {/* Technical Info */}
                <div>
                  <h3 className="text-sm font-medium text-[#A8DF8E] mb-3">Technical Information</h3>
                  <div className="space-y-2 text-xs text-gray-400 bg-gray-800/50 p-4 rounded-xl">
                    <p><span className="font-medium text-gray-300">Source:</span> {selectedContact.source.replace('_', ' ')}</p>
                    <p><span className="font-medium text-gray-300">Status:</span> {selectedContact.status}</p>
                    {selectedContact.repliedAt && (
                      <p><span className="font-medium text-gray-300">Replied at:</span> {formatDate(selectedContact.repliedAt)}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => updateContactStatus(selectedContact.id, 'read')}
                    disabled={selectedContact.status === 'read' || selectedContact.status === 'replied'}
                    className="px-4 py-2.5 bg-yellow-500/20 text-yellow-400 text-sm rounded-xl hover:bg-yellow-500/30 border border-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Mark as Read
                  </button>
                  <button
                    onClick={() => updateContactStatus(selectedContact.id, 'replied')}
                    disabled={selectedContact.status === 'replied'}
                    className="px-4 py-2.5 bg-[#A8DF8E]/20 text-[#A8DF8E] text-sm rounded-xl hover:bg-[#A8DF8E]/30 border border-[#A8DF8E]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Mark as Replied
                  </button>
                  <a
                    href={`mailto:${selectedContact.email}?subject=Re: ${selectedContact.subject}`}
                    className="px-4 py-2.5 bg-blue-500/20 text-blue-400 text-sm rounded-xl hover:bg-blue-500/30 border border-blue-500/30 transition-all"
                  >
                    <FaReply className="inline mr-1" />
                    Reply via Email
                  </a>
                  <button
                    onClick={() => deleteContact(selectedContact.id)}
                    className="px-4 py-2.5 bg-red-500/20 text-red-400 text-sm rounded-xl hover:bg-red-500/30 border border-red-500/30 transition-all"
                  >
                    <FaTrash className="inline mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FaEye className="h-8 w-8 text-gray-600" />
                </div>
                <p className="text-gray-500">Select a submission to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
