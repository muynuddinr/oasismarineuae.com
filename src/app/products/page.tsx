import React from 'react';
import type { Metadata } from 'next';
import CategoriesClient from '../../components/CategoriesClient';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Product Categories | Oasis Marine Trading LLC',
  description:
    'Explore our comprehensive range of industrial products including valves, gaskets, fasteners, and more. High-quality marine and industrial solutions from Oasis Marine Trading LLC.',
  keywords:
    'industrial products, marine supplies, valves, gaskets, fasteners, Oasis Marine products, UAE industrial solutions',
  openGraph: {
    title: 'Product Categories | Oasis Marine Trading LLC',
    description:
      'Explore our comprehensive range of industrial products including valves, gaskets, fasteners, and more. High-quality marine and industrial solutions.',
    type: 'website',
    url: 'https://oasismarineuae.com/products',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SubcategoriesPage() {
  return <CategoriesClient />;
}