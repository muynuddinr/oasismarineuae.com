import { defaultMetadata, organizationSchema } from '../utils/seo';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalNavbar from "../components/ConditionalNavbar";
import ConditionalFooter from "@/components/ConditionalFooter";
import favicon from "./favicon.jpg";
import Whatsapp from '@/components/Whatsapp';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  ...defaultMetadata,
  icons: {
    icon: '/favicon.jpg'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href={favicon.src} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema)
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressContentEditableWarning={true}
      >
        <ConditionalNavbar />
        <Whatsapp />
        {children}
        <ConditionalFooter/>
      </body>
    </html>
  );
}