import { Metadata } from "next";
import { Suspense } from "react";
import ProductDetailClient from "../../../../components/ProductDetailClient";
import ProductModel from "@/models/Product";

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ subcategory: string; productSlug: string }>;
}

// Fetch product by slug directly from database
async function fetchProductBySlug(slug: string) {
  try {
    const product = await ProductModel.findBySlug(slug);
    return product;
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { productSlug, subcategory } = resolvedParams;
  
  const product = await fetchProductBySlug(productSlug);
  const productName = product?.name || productSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const subcategoryName = subcategory
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${productName} | ${subcategoryName} Products | Oasis Marine Trading LLC`,
    description: product?.shortDescription || 
      `Explore our ${subcategoryName} products including ${productName}. High-quality marine and industrial solutions from Oasis Marine Trading LLC.`,
    keywords:
      `${productName}, ${subcategoryName}, marine equipment, industrial supplies, Oasis Marine, UAE`,
    openGraph: {
      title: `${productName} | ${subcategoryName} Products | Oasis Marine Trading LLC`,
      description: product?.shortDescription ||
        `Explore our ${subcategoryName} products including ${productName}. High-quality marine and industrial solutions.`,
      type: 'website',
      images: product?.cardImage ? [product.cardImage] : [],
      url: `https://oasismarineuae.com/products/${subcategory}/${productSlug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const resolvedParams = await params;
  const { productSlug } = resolvedParams;
  
  // Fetch the product to get its ID
  const product = await fetchProductBySlug(productSlug);
  
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Product Not Found</h1>
          <p className="text-gray-600">The product you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }
  
  // Map to the format expected by ProductDetailClient
  const mappedParams = { id: product._id?.toString() || '' };
  
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
          <p className="text-xl text-gray-600">Loading product...</p>
        </div>
      </div>
    }>
      <ProductDetailClient params={mappedParams} />
    </Suspense>
  );
}
