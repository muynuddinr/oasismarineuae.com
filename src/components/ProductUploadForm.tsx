import React, { useState, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ProductUploadFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function ProductUploadForm({ onSuccess, onError }: ProductUploadFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    longDescription: '',
    categoryId: '',
    subcategoryId: '',
    isActive: true,
    shortFeatures: [] as string[],
    specifications: {} as Record<string, string>
  });

  const [files, setFiles] = useState({
    cardImage: null as File | null,
    detailImages: [] as File[],
    catalogFile: null as File | null
  });

  const [uploading, setUploading] = useState(false);
  const [featureInput, setFeatureInput] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const cardImageRef = useRef<HTMLInputElement>(null);
  const detailImagesRef = useRef<HTMLInputElement>(null);
  const catalogFileRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleCardImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        onError?.('Card image must be less than 5MB');
        return;
      }
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        onError?.('Card image must be JPEG, PNG, WebP, or GIF');
        return;
      }
      setFiles(prev => ({ ...prev, cardImage: file }));
    }
  };

  const handleDetailImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    
    // Validate each file
    const validFiles = newFiles.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        onError?.(`${file.name} is too large (max 5MB)`);
        return false;
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        onError?.(`${file.name} has invalid format`);
        return false;
      }
      return true;
    });

    setFiles(prev => ({
      ...prev,
      detailImages: [...prev.detailImages, ...validFiles]
    }));
  };

  const handleCatalogFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onError?.('Catalog file must be less than 5MB');
        return;
      }
      if (file.type !== 'application/pdf') {
        onError?.('Catalog file must be PDF format');
        return;
      }
      setFiles(prev => ({ ...prev, catalogFile: file }));
    }
  };

  const removeDetailImage = (index: number) => {
    setFiles(prev => ({
      ...prev,
      detailImages: prev.detailImages.filter((_, i) => i !== index)
    }));
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        shortFeatures: [...prev.shortFeatures, featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      shortFeatures: prev.shortFeatures.filter((_, i) => i !== index)
    }));
  };

  const addSpecification = () => {
    if (specKey.trim() && specValue.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: { ...prev.specifications, [specKey]: specValue }
      }));
      setSpecKey('');
      setSpecValue('');
    }
  };

  const removeSpecification = (key: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: Object.fromEntries(
        Object.entries(prev.specifications).filter(([k]) => k !== key)
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      if (!files.cardImage) {
        onError?.('Card image is required');
        setUploading(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('shortDescription', formData.shortDescription);
      formDataToSend.append('longDescription', formData.longDescription);
      formDataToSend.append('categoryId', formData.categoryId);
      formDataToSend.append('subcategoryId', formData.subcategoryId);
      formDataToSend.append('isActive', String(formData.isActive));
      formDataToSend.append('shortFeatures', JSON.stringify(formData.shortFeatures));
      formDataToSend.append('specifications', JSON.stringify(formData.specifications));
      formDataToSend.append('cardImage', files.cardImage);

      // Add detail images
      files.detailImages.forEach(file => {
        formDataToSend.append('detailImages', file);
      });

      // Add catalog file if present
      if (files.catalogFile) {
        formDataToSend.append('catalogFile', files.catalogFile);
      }

      const response = await fetch('/api/admin/products/create', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      // Reset form
      setFormData({
        name: '',
        shortDescription: '',
        longDescription: '',
        categoryId: '',
        subcategoryId: '',
        isActive: true,
        shortFeatures: [],
        specifications: {}
      });
      setFiles({
        cardImage: null,
        detailImages: [],
        catalogFile: null
      });

      if (cardImageRef.current) cardImageRef.current.value = '';
      if (detailImagesRef.current) detailImagesRef.current.value = '';
      if (catalogFileRef.current) catalogFileRef.current.value = '';

      onSuccess?.();
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto p-6 bg-white rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Add New Product</h2>

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Product Information</h3>
        
        <div>
          <label className="block text-sm font-medium mb-1">Product Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter product name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Short Description *</label>
          <textarea
            name="shortDescription"
            value={formData.shortDescription}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter short description"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Long Description</label>
          <textarea
            name="longDescription"
            value={formData.longDescription}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter detailed description"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input
              type="text"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Category ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subcategory</label>
            <input
              type="text"
              name="subcategoryId"
              value={formData.subcategoryId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Subcategory ID"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Active</span>
          </label>
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Images (Cloudinary)</h3>
        
        <div>
          <label className="block text-sm font-medium mb-2">Card Image (Thumbnail) *</label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            {files.cardImage ? (
              <div className="flex items-center justify-between">
                <span className="text-sm">{files.cardImage.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFiles(prev => ({ ...prev, cardImage: null }));
                    if (cardImageRef.current) cardImageRef.current.value = '';
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <input
                ref={cardImageRef}
                type="file"
                accept="image/*"
                onChange={handleCardImageChange}
                className="w-full"
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Detail Images</label>
          <input
            ref={detailImagesRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleDetailImagesChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {files.detailImages.length > 0 && (
            <div className="mt-2 space-y-2">
              {files.detailImages.map((file, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                  <span className="text-sm">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeDetailImage(i)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Catalog File (PDF)</label>
          <input
            ref={catalogFileRef}
            type="file"
            accept="application/pdf"
            onChange={handleCatalogFileChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {files.catalogFile && (
            <p className="mt-2 text-sm text-gray-600">{files.catalogFile.name}</p>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Features</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addFeature();
              }
            }}
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter feature and press Enter"
          />
          <button
            type="button"
            onClick={addFeature}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Add
          </button>
        </div>
        {formData.shortFeatures.length > 0 && (
          <div className="space-y-2">
            {formData.shortFeatures.map((feature, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                <span className="text-sm">{feature}</span>
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Specifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Specifications</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={specKey}
            onChange={(e) => setSpecKey(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Key (e.g., Color)"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={specValue}
              onChange={(e) => setSpecValue(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Value"
            />
            <button
              type="button"
              onClick={addSpecification}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </div>
        {Object.entries(formData.specifications).length > 0 && (
          <div className="space-y-2">
            {Object.entries(formData.specifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                <span className="text-sm"><strong>{key}:</strong> {value}</span>
                <button
                  type="button"
                  onClick={() => removeSpecification(key)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={uploading}
        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
      >
        {uploading ? 'Uploading to Cloudinary...' : 'Create Product'}
      </button>
    </form>
  );
}
