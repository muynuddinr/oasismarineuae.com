'use client'

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { FaEnvelope, FaPhone, FaUser, FaCalendarAlt, FaReply, FaTrash, FaEye } from 'react-icons/fa';
import { MdMarkEmailRead, MdMarkEmailUnread } from 'react-icons/md';
import { ExclamationTriangleIcon, EnvelopeIcon, UserIcon, PhoneIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  priority: 'low' | 'medium' | 'high';
  userId?: string;
  productId?: string;
  productName?: string;
  productImage?: string;
  enquiryType?: 'product' | 'general' | 'support';
  createdAt: string;
  updatedAt: string;
  repliedAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      console.log('Fetching contacts from frontend...')
      const response = await fetch('/api/contacts');
      console.log('Response status:', response.status)
      console.log('Response URL:', response.url)
      
      if (response.ok) {
        const data = await response.json();
        console.log('Received contacts:', data)
        console.log('Number of contacts:', data.length)
        if (data.length > 0) {
          console.log('First contact ID type:', typeof data[0].id)
          console.log('First contact _id type:', typeof data[0]._id)
          console.log('First contact ID value:', data[0].id)
        }
        setContacts(data);
        setError('');
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData)
        setError(`Failed to fetch contacts: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setError('Network error while fetching contacts');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || contact.status === statusFilter;
    const matchesPriority = priorityFilter === '' || contact.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'low':
        return 'bg-[#A8DF8E]/20 text-[#A8DF8E] border border-[#A8DF8E]/30';
      default:
        return 'bg-gray-700 text-gray-300 border border-gray-600';
    }
  };

  const updateContactStatus = async (id: string, status: 'new' | 'read' | 'replied') => {
    try {
      console.log('Updating contact status:', id, 'to:', status);
      
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      console.log('Update response status:', response.status);

      if (response.ok) {
        try {
          const result = await response.json();
          console.log('Update successful:', result);
          toast.success(`Contact marked as ${status === 'replied' ? 'replied' : 'read'} successfully`);
          fetchContacts(); // Refresh the list
          
          // Update the selected contact state
          if (selectedContact?.id === id) {
            setSelectedContact({
              ...selectedContact,
              status,
              repliedAt: status === 'replied' ? new Date().toISOString() : selectedContact.repliedAt
            });
          }
        } catch (parseError) {
          console.error('Error parsing success response:', parseError);
          toast.success(`Contact status updated successfully`);
          // Still refresh even if parsing fails, as the update likely succeeded
          fetchContacts();
        }
      } else {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          console.error('Update failed:', errorData);
          errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        toast.error(`Failed to update status: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (error instanceof TypeError && errorMessage.includes('fetch')) {
        toast.error('Network error: Unable to connect to server. Please check your connection.');
      } else {
        toast.error(`Network error while updating contact status: ${errorMessage}`);
      }
    }
  };

  const deleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      console.log('Deleting contact:', id);
      
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status);

      if (response.ok) {
        console.log('Delete successful');
        toast.success('Contact deleted successfully');
        fetchContacts(); // Refresh the list
        setSelectedContact(null); // Clear selection
      } else {
        const errorData = await response.json();
        console.error('Delete failed:', errorData);
        toast.error(`Failed to delete contact: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Network error while deleting contact');
    }
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
                onClick={fetchContacts}
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
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#A8DF8E] to-[#7BC96F] rounded-2xl flex items-center justify-center">
            <FaEnvelope className="text-black text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Contact Management</h1>
            <p className="text-gray-400">
              Manage customer inquiries and support requests
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-800 hover:border-[#A8DF8E]/30 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Contacts</p>
                <p className="text-3xl font-bold text-white mt-1">{contacts.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <EnvelopeIcon className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-800 hover:border-[#A8DF8E]/30 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">New Messages</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {contacts.filter(c => c.status === 'new').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <EnvelopeIcon className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-800 hover:border-[#A8DF8E]/30 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Replied</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {contacts.filter(c => c.status === 'replied').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#A8DF8E]/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <EnvelopeIcon className="h-6 w-6 text-[#A8DF8E]" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-800 hover:border-[#A8DF8E]/30 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">High Priority</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {contacts.filter(c => c.priority === 'high').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Contacts
              </label>
              <input
                type="text"
                placeholder="Search by name, email, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
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
                Filter by Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent transition-all"
              >
                <option value="">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Messages List */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">
                Messages ({filteredContacts.length})
              </h2>
            </div>

            <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {contacts.length === 0 ? 'No contacts found' : 'No contacts match your filters'}
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
                          <span className={`px-2 py-1 text-xs rounded-lg ${getPriorityColor(contact.priority)}`}>
                            {contact.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-1">{contact.email}</p>
                        <p className="text-sm font-medium text-gray-300 mb-1">{contact.subject}</p>
                        <p className="text-xs text-gray-500">{formatDate(contact.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Contact Details</h2>
            </div>

            {selectedContact ? (
              <div className="p-6 space-y-6">
                {/* Contact Info */}
                <div>
                  <h3 className="text-sm font-medium text-[#A8DF8E] mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <UserIcon className="h-4 w-4 text-gray-500 mr-3" />
                      <span className="text-gray-300">{selectedContact.name}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <EnvelopeIcon className="h-4 w-4 text-gray-500 mr-3" />
                      <span className="text-gray-300">{selectedContact.email}</span>
                    </div>
                    {selectedContact.phone && (
                      <div className="flex items-center text-sm">
                        <PhoneIcon className="h-4 w-4 text-gray-500 mr-3" />
                        <span className="text-gray-300">{selectedContact.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm">
                      <ClockIcon className="h-4 w-4 text-gray-500 mr-3" />
                      <span className="text-gray-300">{formatDate(selectedContact.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                {selectedContact.productName && (
                  <div>
                    <h3 className="text-sm font-medium text-[#A8DF8E] mb-3">Product Information</h3>
                    <div className="flex items-center space-x-3 bg-gray-800/50 rounded-xl p-3">
                      {selectedContact.productImage && (
                        <img
                          src={selectedContact.productImage}
                          alt={selectedContact.productName}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-white">{selectedContact.productName}</p>
                        {selectedContact.productId && (
                          <p className="text-xs text-gray-500">ID: {selectedContact.productId}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Message */}
                <div>
                  <h3 className="text-sm font-medium text-[#A8DF8E] mb-3">Message</h3>
                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <p className="text-sm text-gray-300">{selectedContact.message}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => updateContactStatus(selectedContact.id, 'read')}
                    disabled={selectedContact.status === 'read'}
                    className="px-4 py-2.5 bg-yellow-500/20 text-yellow-400 text-sm rounded-xl hover:bg-yellow-500/30 border border-yellow-500/30 disabled:opacity-50 transition-all"
                  >
                    Mark as Read
                  </button>
                  <button
                    onClick={() => updateContactStatus(selectedContact.id, 'replied')}
                    disabled={selectedContact.status === 'replied'}
                    className="px-4 py-2.5 bg-[#A8DF8E]/20 text-[#A8DF8E] text-sm rounded-xl hover:bg-[#A8DF8E]/30 border border-[#A8DF8E]/30 disabled:opacity-50 transition-all"
                  >
                    Mark as Replied
                  </button>
                  <button
                    onClick={() => deleteContact(selectedContact.id)}
                    className="px-4 py-2.5 bg-red-500/20 text-red-400 text-sm rounded-xl hover:bg-red-500/30 border border-red-500/30 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="h-8 w-8 text-gray-600" />
                </div>
                <p className="text-gray-500">Select a contact to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </AdminLayout>
  );
}
