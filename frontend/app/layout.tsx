import type { Metadata } from "next";
import "./globals.css";
import { RoleProvider } from "@/lib/roleContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ColdStartBanner from "@/components/ColdStartBanner";

export const metadata: Metadata = {
  title: "BrandLens — Brand Guidelines & Facts Verifier",
  description:
    "Check content against approved company brand guidelines, terminology, facts, and assets before publishing with human-in-the-loop decisions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen antialiased bg-gray-50 text-gray-900">
        <RoleProvider>
          <ColdStartBanner />
          <Header />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </RoleProvider>
      </body>
    </html>
  );
}

