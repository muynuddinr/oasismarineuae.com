import { Metadata } from "next";
import { Suspense } from "react";
import ClientCategoryPage from "../../../components/ClientCategoryPage";

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ subcategory: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const subcategory = resolvedParams.subcategory;
  
  const subcategoryName = subcategory
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${subcategoryName} Products | Oasis Marine Trading LLC`,
    description:
      `Explore our comprehensive range of ${subcategoryName} products. High-quality marine and industrial solutions from Oasis Marine Trading LLC.`,
    keywords:
      `${subcategoryName}, industrial products, marine supplies, Oasis Marine products, UAE industrial solutions`,
    openGraph: {
      title: `${subcategoryName} Products | Oasis Marine Trading LLC`,
      description:
        `Explore our comprehensive range of ${subcategoryName} products. High-quality marine and industrial solutions.`,
      type: 'website',
      url: `https://oasismarineuae.com/products/${subcategory}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function SubcategoryPage({ params }: Props) {
  // Map subcategory param to slug for the ClientCategoryPage component
  const resolvedParams = await params;
  const mappedParams = Promise.resolve({ slug: resolvedParams.subcategory });
  
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
          <p className="text-xl text-gray-600">Loading products...</p>
        </div>
      </div>
    }>
      <ClientCategoryPage params={mappedParams} />
    </Suspense>
  );
}
