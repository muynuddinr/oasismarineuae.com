import { Metadata } from "next";
import { Suspense } from "react";
import ProductDetailClient from "../../../../components/ProductDetailClient";

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ subcategory: string; productSlug: string }>;
}

// Fetch product by slug to get its ID
async function fetchProductBySlug(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/products?slug=${slug}`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return null;
    }
    
    const products = await response.json();
    return products.find((p: any) => p.slug === slug) || null;
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
    description:
      `Explore ${productName} in our ${subcategoryName} range. High-quality marine and industrial solutions from Oasis Marine Trading LLC.`,
    keywords:
      `${productName}, ${subcategoryName}, industrial products, marine supplies, Oasis Marine products, UAE industrial solutions`,
    openGraph: {
      title: `${productName} | ${subcategoryName} Products | Oasis Marine Trading LLC`,
      description:
        `Explore ${productName} in our ${subcategoryName} range. High-quality marine and industrial solutions.`,
      type: 'website',
      url: `https://oasismarineuae.com/products/${subcategory}/${productSlug}`,
      images: product?.cardImage ? [product.cardImage] : [],
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
  const mappedParams = { id: product.id };
  
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
