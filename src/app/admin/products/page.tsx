'use client'

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { FaEdit, FaTrash, FaPlus, FaSave, FaTimes, FaEye, FaImage, FaUpload, FaFilePdf } from 'react-icons/fa';
import { MdCategory, MdInventory, MdAdd, MdRemove } from 'react-icons/md';
import { toast } from 'react-toastify';

interface Product {
  id: string;
  name: string;
  shortDescription: string;
  longDescription?: string;
  cardImage: string;
  detailImages: string[];
  shortFeatures: string[];
  specifications?: any;
  reviewsData?: any;
  catalogFile?: string;
  categoryId?: string;
  subcategoryId?: string;
  isActive: boolean;
  createdAt: string;
  category?: {
    id: string;
    name: string;
  };
  subcategory?: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});

  const [newProduct, setNewProduct] = useState({
    name: '',
    shortDescription: '',
    longDescription: '',
    cardImage: '',
    detailImages: [] as string[],
    shortFeatures: [] as string[],
    specifications: {} as any,
    reviewsData: {} as any,
    catalogFile: '',
    categoryId: '',
    subcategoryId: '',
    isActive: true
  });

  // Fetch products and categories on component mount
  useEffect(() => {
    // Check admin authentication - user is admin if they have adminSession cookie
    // Since we're in the admin area and passed through AdminLayout, user is authenticated
    setIsAdmin(true); // Admin area is protected by AdminLayout already
    
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products);
      } else {
        toast.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/navbar');
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const uploadFile = async (file: File, type: 'image' | 'pdf'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const data = await response.json();
    return data.url;
  };

  const handleFileUpload = async (file: File, type: 'card' | 'detail' | 'catalog', index?: number) => {
    const uploadKey = `${type}-${index || 0}`;
    setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }));

    try {
      const fileType = type === 'catalog' ? 'pdf' : 'image';
      const url = await uploadFile(file, fileType);

      if (type === 'card') {
        setNewProduct(prev => ({ ...prev, cardImage: url }));
      } else if (type === 'detail') {
        setNewProduct(prev => ({
          ...prev,
          detailImages: [...prev.detailImages, url]
        }));
      } else if (type === 'catalog') {
        setNewProduct(prev => ({ ...prev, catalogFile: url }));
      }

      toast.success(`${type} uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const addFeature = () => {
    setNewProduct(prev => ({
      ...prev,
      shortFeatures: [...prev.shortFeatures, '']
    }));
  };

  const removeFeature = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      shortFeatures: prev.shortFeatures.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setNewProduct(prev => ({
      ...prev,
      shortFeatures: prev.shortFeatures.map((feature, i) => 
        i === index ? value : feature
      )
    }));
  };

  const removeDetailImage = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      detailImages: prev.detailImages.filter((_, i) => i !== index)
    }));
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === '' || product.categoryId === categoryFilter;
    const matchesSubcategory = subcategoryFilter === '' || product.subcategoryId === subcategoryFilter;
    
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const getSubcategoriesForCategory = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.subcategories || [];
  };

  const addNewProduct = async () => {
    if (newProduct.name && newProduct.shortDescription && newProduct.cardImage) {
      try {
        const response = await fetch('/api/admin/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': process.env.NEXT_PUBLIC_CSRF_SECRET || '',
          },
          body: JSON.stringify(newProduct),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Reset form
          setNewProduct({
            name: '',
            shortDescription: '',
            longDescription: '',
            cardImage: '',
            detailImages: [],
            shortFeatures: [],
            specifications: {},
            reviewsData: {},
            catalogFile: '',
            categoryId: '',
            subcategoryId: '',
            isActive: true
          });
          setShowAddForm(false);
          
          // Refetch all products to ensure frontend is in sync with backend
          await fetchProducts();
          
          toast.success('Product created successfully');
        } else {
          const errorData = await response.json();
          console.error('Failed to create product:', errorData);
          toast.error(`Failed to create product: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error creating product:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to create product: ${errorMessage}`);
      }
    } else {
      toast.error('Please fill in required fields');
    }
  };

  const updateProduct = async () => {
    if (editingProduct && editingProduct.name && editingProduct.shortDescription && editingProduct.cardImage) {
      try {
        const response = await fetch('/api/admin/products', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': process.env.NEXT_PUBLIC_CSRF_SECRET || '',
          },
          body: JSON.stringify(editingProduct),
        });

        if (response.ok) {
          const data = await response.json();
          setProducts(products.map(p => 
            p.id === editingProduct.id ? data.product : p
          ));
          setEditingProduct(null);
          toast.success('Product updated successfully');
        } else {
          let errorMessage = 'Unknown error';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || 'Unknown error';
            console.error('Product update error details:', errorData);
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
            errorMessage = `HTTP ${response.status}`;
          }
          console.error('Failed to update product. Error:', errorMessage);
          toast.error(`Failed to update product: ${errorMessage}`);
        }
      } catch (error) {
        console.error('Error updating product:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Network error while updating product: ${errorMessage}`);
      }
    } else {
      toast.error('Please fill in required fields');
    }
  };

  const handleEditFileUpload = async (file: File, type: 'card' | 'detail' | 'catalog', index?: number) => {
    if (!editingProduct) return;
    
    const uploadKey = `edit-${type}-${index || 0}`;
    setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }));

    try {
      const fileType = type === 'catalog' ? 'pdf' : 'image';
      const url = await uploadFile(file, fileType);

      if (type === 'card') {
        setEditingProduct(prev => prev ? { ...prev, cardImage: url } : null);
      } else if (type === 'detail') {
        setEditingProduct(prev => prev ? {
          ...prev,
          detailImages: [...prev.detailImages, url]
        } : null);
      } else if (type === 'catalog') {
        setEditingProduct(prev => prev ? { ...prev, catalogFile: url } : null);
      }

      toast.success(`${type} uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const addEditFeature = () => {
    if (!editingProduct) return;
    setEditingProduct(prev => prev ? {
      ...prev,
      shortFeatures: [...prev.shortFeatures, '']
    } : null);
  };

  const removeEditFeature = (index: number) => {
    if (!editingProduct) return;
    setEditingProduct(prev => prev ? {
      ...prev,
      shortFeatures: prev.shortFeatures.filter((_, i) => i !== index)
    } : null);
  };

  const updateEditFeature = (index: number, value: string) => {
    if (!editingProduct) return;
    setEditingProduct(prev => prev ? {
      ...prev,
      shortFeatures: prev.shortFeatures.map((feature, i) => 
        i === index ? value : feature
      )
    } : null);
  };

  const removeEditDetailImage = (index: number) => {
    if (!editingProduct) return;
    setEditingProduct(prev => prev ? {
      ...prev,
      detailImages: prev.detailImages.filter((_, i) => i !== index)
    } : null);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        setProducts(products.filter(p => p.id !== id));
        toast.success('Product deleted successfully');
      } else {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        toast.error(`Failed to delete product: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Network error while deleting product: ${errorMessage}`);
    }
  };

  const updateProductStatus = async (id: string, isActive: boolean) => {
    try {
      const requestBody = { id, isActive };
      
      const response = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        setProducts(products.map(p => 
          p.id === id ? { ...p, isActive } : p
        ));
        toast.success('Product status updated');
      } else {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || 'Unknown error';
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}`;
        }
        toast.error(`Failed to update product status: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error updating product status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Network error while updating status: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-300">Loading products...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Products Management</h1>
              <p className="text-gray-400 mt-1">Manage your marine products inventory</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 sm:mt-0 inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-[#A8DF8E] to-[#7BC96F] text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-[#A8DF8E]/20 transition-all duration-200"
            >
              <FaPlus className="mr-2" />
              Add Product
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 border border-gray-800">
            <div className="flex items-center">
              <div className="p-3 bg-[#A8DF8E]/20 rounded-xl">
                <MdInventory className="h-6 w-6 text-[#A8DF8E]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Products</p>
                <p className="text-2xl font-bold text-white">{products.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 border border-gray-800">
            <div className="flex items-center">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <MdCategory className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Active Products</p>
                <p className="text-2xl font-bold text-white">
                  {products.filter(p => p.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 border border-gray-800">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <FaEye className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Inactive Products</p>
                <p className="text-2xl font-bold text-white">
                  {products.filter(p => !p.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 border border-gray-800">
            <div className="flex items-center">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <MdCategory className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Categories</p>
                <p className="text-2xl font-bold text-white">{categories.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Product Form */}
        {showAddForm && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-[#A8DF8E]/30">
            <h3 className="text-lg font-semibold text-white mb-4">Add New Product</h3>
            
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g., Marine Navigation Light"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={newProduct.categoryId}
                  onChange={(e) => {
                    setNewProduct({ ...newProduct, categoryId: e.target.value, subcategoryId: '' });
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subcategory</label>
                <select
                  value={newProduct.subcategoryId}
                  onChange={(e) => setNewProduct({ ...newProduct, subcategoryId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent"
                  disabled={!newProduct.categoryId}
                >
                  <option value="">Select Subcategory</option>
                  {getSubcategoriesForCategory(newProduct.categoryId).map(subcat => (
                    <option key={subcat.id} value={subcat.id}>{subcat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Short Description *</label>
                <textarea
                  value={newProduct.shortDescription}
                  onChange={(e) => setNewProduct({ ...newProduct, shortDescription: e.target.value })}
                  rows={2}
                  placeholder="Brief product description for cards"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Long Description</label>
                <textarea
                  value={newProduct.longDescription}
                  onChange={(e) => setNewProduct({ ...newProduct, longDescription: e.target.value })}
                  rows={4}
                  placeholder="Detailed product description"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent"
                />
              </div>
            </div>

            {/* Card Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Card Image *</label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'card');
                  }}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                {uploadingFiles['card-0'] && <div className="text-sm text-gray-400">Uploading...</div>}
              </div>
              {newProduct.cardImage && (
                <div className="mt-2">
                  <img src={newProduct.cardImage} alt="Card preview" className="h-20 w-20 object-cover rounded" />
                </div>
              )}
            </div>

            {/* Detail Images Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Detail Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(file => handleFileUpload(file, 'detail'));
                }}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              {newProduct.detailImages.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {newProduct.detailImages.map((img, index) => (
                    <div key={index} className="relative">
                      <img src={img} alt={`Detail ${index + 1}`} className="h-20 w-20 object-cover rounded" />
                      <button
                        onClick={() => removeDetailImage(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Short Features</label>
              {newProduct.shortFeatures.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="Feature description"
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent"
                  />
                  <button
                    onClick={() => removeFeature(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <MdRemove />
                  </button>
                </div>
              ))}
              <button
                onClick={addFeature}
                className="inline-flex items-center px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-700"
              >
                <MdAdd className="mr-1" />
                Add Feature
              </button>
            </div>

            {/* Catalog File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Catalog PDF</label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'catalog');
                  }}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                {uploadingFiles['catalog-0'] && <div className="text-sm text-gray-400">Uploading...</div>}
              </div>
              {newProduct.catalogFile && (
                <div className="mt-2 flex items-center space-x-2">
                  <FaFilePdf className="text-red-600" />
                  <a href={newProduct.catalogFile} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                    View Catalog
                  </a>
                </div>
              )}
            </div>

            {/* Specifications Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Product Specifications</label>
              <textarea
                value={JSON.stringify(newProduct.specifications, null, 2)}
                onChange={(e) => {
                  try {
                    const specs = JSON.parse(e.target.value);
                    setNewProduct({ ...newProduct, specifications: specs });
                  } catch {
                    // Invalid JSON, don't update
                  }
                }}
                rows={6}
                placeholder={`{
  "dimensions": "10cm x 5cm x 2cm",
  "weight": "150g",
  "voltage": "DC 12V",
  "power": "15W",
  "color_temperature": "3000K-6500K",
  "material": "Aluminum"
}`}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Enter specifications as JSON format</p>
            </div>

            {/* Reviews Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Product Reviews</label>
              <div className="border border-gray-700 rounded-xl p-4 bg-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Average Rating</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={newProduct.reviewsData?.averageRating || ''}
                      onChange={(e) => {
                        const rating = parseFloat(e.target.value) || 0;
                        setNewProduct({ 
                          ...newProduct, 
                          reviewsData: { 
                            ...newProduct.reviewsData, 
                            averageRating: rating 
                          } 
                        });
                      }}
                      placeholder="4.5"
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Total Reviews</label>
                    <input
                      type="number"
                      min="0"
                      value={newProduct.reviewsData?.totalReviews || ''}
                      onChange={(e) => {
                        const total = parseInt(e.target.value) || 0;
                        setNewProduct({ 
                          ...newProduct, 
                          reviewsData: { 
                            ...newProduct.reviewsData, 
                            totalReviews: total 
                          } 
                        });
                      }}
                      placeholder="25"
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                    />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Reviews (JSON Format)</label>
                  <textarea
                    value={JSON.stringify(newProduct.reviewsData?.reviews || [], null, 2)}
                    onChange={(e) => {
                      try {
                        const reviews = JSON.parse(e.target.value);
                        setNewProduct({ 
                          ...newProduct, 
                          reviewsData: { 
                            ...newProduct.reviewsData, 
                            reviews: reviews 
                          } 
                        });
                      } catch {
                        // Invalid JSON, don't update
                      }
                    }}
                    rows={6}
                    placeholder={`[
  {
    "name": "John Doe",
    "rating": 5,
    "comment": "Excellent LED light quality!",
    "date": "2024-01-15"
  },
  {
    "name": "Jane Smith", 
    "rating": 4,
    "comment": "Good brightness and easy installation",
    "date": "2024-01-10"
  }
]`}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-gray-400">💡 Add individual reviews as JSON array with name, rating (1-5), comment, and date fields</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={addNewProduct}
                disabled={!newProduct.name || !newProduct.shortDescription || !newProduct.cardImage}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                <FaSave className="mr-2" />
                Add Product
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewProduct({
                    name: '',
                    shortDescription: '',
                    longDescription: '',
                    cardImage: '',
                    detailImages: [],
                    shortFeatures: [],
                    specifications: {},
                    reviewsData: {},
                    catalogFile: '',
                    categoryId: '',
                    subcategoryId: '',
                    isActive: true
                  });
                }}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FaTimes className="mr-2" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Edit Product Form */}
        {editingProduct && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border-l-4 border-l-blue-500 border-y border-r border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Product</h3>
            
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={editingProduct.categoryId || ''}
                  onChange={(e) => {
                    setEditingProduct({ ...editingProduct, categoryId: e.target.value, subcategoryId: '' });
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subcategory</label>
                <select
                  value={editingProduct.subcategoryId || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, subcategoryId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent"
                  disabled={!editingProduct.categoryId}
                >
                  <option value="">Select Subcategory</option>
                  {getSubcategoriesForCategory(editingProduct.categoryId || '').map(subcat => (
                    <option key={subcat.id} value={subcat.id}>{subcat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Short Description *</label>
                <textarea
                  value={editingProduct.shortDescription}
                  onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Long Description</label>
                <textarea
                  value={editingProduct.longDescription || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, longDescription: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent"
                />
              </div>
            </div>

            {/* Card Image */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Card Image *</label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleEditFileUpload(file, 'card');
                  }}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadingFiles['edit-card-0'] && <div className="text-sm text-gray-400">Uploading...</div>}
              </div>
              {editingProduct.cardImage && (
                <div className="mt-2">
                  <img src={editingProduct.cardImage} alt="Card preview" className="h-20 w-20 object-cover rounded" />
                </div>
              )}
            </div>

            {/* Detail Images */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Detail Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(file => handleEditFileUpload(file, 'detail'));
                }}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {editingProduct.detailImages.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {editingProduct.detailImages.map((img, index) => (
                    <div key={index} className="relative">
                      <img src={img} alt={`Detail ${index + 1}`} className="h-20 w-20 object-cover rounded" />
                      <button
                        onClick={() => removeEditDetailImage(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Short Features</label>
              {editingProduct.shortFeatures.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateEditFeature(index, e.target.value)}
                    placeholder="Feature description"
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent"
                  />
                  <button
                    onClick={() => removeEditFeature(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <MdRemove />
                  </button>
                </div>
              ))}
              <button
                onClick={addEditFeature}
                className="inline-flex items-center px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-700"
              >
                <MdAdd className="mr-1" />
                Add Feature
              </button>
            </div>

            {/* Specifications */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Product Specifications</label>
              <textarea
                value={JSON.stringify(editingProduct.specifications || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const specs = JSON.parse(e.target.value);
                    setEditingProduct({ ...editingProduct, specifications: specs });
                  } catch {
                    // Invalid JSON, don't update
                  }
                }}
                rows={6}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent font-mono text-sm"
              />
            </div>

            {/* Reviews */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Product Reviews (Array)</label>
              <textarea
                value={JSON.stringify(editingProduct.reviewsData || [], null, 2)}
                onChange={(e) => {
                  try {
                    const reviews = JSON.parse(e.target.value);
                    setEditingProduct({ ...editingProduct, reviewsData: reviews });
                  } catch {
                    // Invalid JSON, don't update
                  }
                }}
                rows={8}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent font-mono text-sm"
              />
            </div>

            {/* Catalog File */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Catalog PDF</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleEditFileUpload(file, 'catalog');
                }}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {editingProduct.catalogFile && (
                <div className="mt-2 flex items-center space-x-2">
                  <FaFilePdf className="text-red-600" />
                  <a href={editingProduct.catalogFile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View Catalog
                  </a>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={updateProduct}
                disabled={!editingProduct.name || !editingProduct.shortDescription || !editingProduct.cardImage}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                <FaSave className="mr-2" />
                Update Product
              </button>
              <button
                onClick={() => setEditingProduct(null)}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FaTimes className="mr-2" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-800 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search Products</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or description..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setSubcategoryFilter('');
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Subcategory</label>
              <select
                value={subcategoryFilter}
                onChange={(e) => setSubcategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-[#A8DF8E] focus:border-transparent"
                disabled={!categoryFilter}
              >
                <option value="">All Subcategories</option>
                {getSubcategoriesForCategory(categoryFilter).map(subcat => (
                  <option key={subcat.id} value={subcat.id}>{subcat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-800">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">
              Products ({filteredProducts.length})
            </h2>
          </div>

          <div className="overflow-hidden">
            <table className="w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    Specs
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                    Reviews
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-700">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {product.cardImage ? (
                            <img 
                              src={product.cardImage} 
                              alt={product.name}
                              className="h-10 w-10 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gray-700 rounded-lg flex items-center justify-center">
                              <FaImage className="text-gray-400 text-xs" />
                            </div>
                          )}
                        </div>
                        <div className="ml-3 max-w-xs">
                          <div className="text-sm font-medium text-white truncate">{product.name}</div>
                          <div className="text-xs text-gray-400 truncate">{product.shortDescription}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      <div>
                        <div className="font-medium text-xs">{product.category?.name || 'No Category'}</div>
                        {product.subcategory && (
                          <div className="text-gray-400 text-xs">{product.subcategory.name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white hidden md:table-cell">
                      {product.specifications ? (
                        <span className="inline-flex px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                          {Object.keys(product.specifications).length} specs
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-white hidden lg:table-cell">
                      {product.reviewsData?.totalReviews ? (
                        <span className="inline-flex px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
                          {product.reviewsData.totalReviews} reviews
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.isActive 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (!product.id) {
                              toast.error('Error: Product ID is undefined.');
                              return;
                            }
                            deleteProduct(product.id);
                          }}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
