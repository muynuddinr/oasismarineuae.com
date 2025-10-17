import React from "react";
import Flipbook from "@/components/Flipbook";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Catalog - Oasis Marine Trading LLC",
  description:
    "Browse our interactive digital catalog featuring premium marine and oilfield equipment including valves, fittings, flanges, and specialized repair solutions.",
  keywords: [
    "marine catalog",
    "oilfield equipment",
    "marine valves",
    "industrial fittings",
    "product catalog",
    "marine equipment UAE",
  ],
  openGraph: {
    title: "Interactive Product Catalog - Oasis Marine Trading LLC",
    description:
      "Explore our comprehensive digital product catalog with detailed specifications and technical information.",
    type: "website",
  },
};

export default function FlipbookPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Flipbook />
    </div>
  );
}
