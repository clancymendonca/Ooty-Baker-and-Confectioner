import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import Header from "@/components/Header";
import BannerSlider from "@/components/BannerSlider";
import AboutSection from "@/components/AboutSection";
import ProductsSection from "@/components/ProductsSection";
import InquiryForm from "@/components/InquiryForm";
import Footer from "@/components/Footer";
import NotificationPopup from "@/components/NotificationPopup";
import { Suspense } from "react";

export const revalidate = 60; // Revalidate every 60 seconds

type SerializedProduct = {
  id: number;
  name: string;
  description: string | null;
  imagePath: string | null;
  price: number;
  variety: string | null;
  pricePerGram: number | null;
  vegStatus: string;
  createdAt: Date;
};

async function getProducts(): Promise<{
  productsByCategory: Record<string, SerializedProduct[]>;
  flatProducts: SerializedProduct[];
}> {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        imagePath: true,
        price: true,
        variety: true,
        pricePerGram: true,
        vegStatus: true,
        createdAt: true,
      },
    });

    const serializedProducts: SerializedProduct[] = products.map((product) => ({
      ...product,
      price: Number(product.price),
      pricePerGram: product.pricePerGram ? Number(product.pricePerGram) : null,
    }));

    const productsByCategory: Record<string, SerializedProduct[]> = {};
    serializedProducts.forEach((product) => {
      const category = product.variety || "Uncategorized";
      if (!productsByCategory[category]) {
        productsByCategory[category] = [];
      }
      productsByCategory[category].push(product);
    });

    return { productsByCategory, flatProducts: serializedProducts };
  } catch (error) {
    logger.error("Error fetching products", error);
    return { productsByCategory: {}, flatProducts: [] };
  }
}

export default async function HomePage() {
  const { productsByCategory, flatProducts } = await getProducts();
  const categories = Object.keys(productsByCategory);
  const inquiryProducts = flatProducts.map(({ id, name, variety }) => ({ id, name, variety }));

  return (
    <main className="min-h-screen">
      <Suspense fallback={null}>
        <NotificationPopup />
      </Suspense>
      <Header categories={categories} />
      <BannerSlider />
      {/* Section Divider */}
      <div className="relative w-full h-24 overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-heading/5 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-heading/20 to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-1 bg-heading/20 rounded-full"></div>
      </div>
      <AboutSection />
      {/* Section Divider */}
      <div className="relative w-full h-24 overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-heading/5 to-transparent"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-heading/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-heading/20 to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
          <div className="w-12 h-0.5 bg-heading/30"></div>
          <div className="w-2 h-2 bg-heading/40 rounded-full"></div>
          <div className="w-20 h-1 bg-heading/20 rounded-full"></div>
          <div className="w-2 h-2 bg-heading/40 rounded-full"></div>
          <div className="w-12 h-0.5 bg-heading/30"></div>
        </div>
      </div>
      <ProductsSection productsByCategory={productsByCategory} />
      {/* Section Divider */}
      <div className="relative w-full h-24 overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-heading/5 to-transparent"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-heading/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-heading/20 to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
          <div className="w-12 h-0.5 bg-heading/30"></div>
          <div className="w-2 h-2 bg-heading/40 rounded-full"></div>
          <div className="w-20 h-1 bg-heading/20 rounded-full"></div>
          <div className="w-2 h-2 bg-heading/40 rounded-full"></div>
          <div className="w-12 h-0.5 bg-heading/30"></div>
        </div>
      </div>
      <InquiryForm categories={categories} products={inquiryProducts} />
      {/* Section Divider */}
      <div className="relative w-full h-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-1 bg-white/20 rounded-full"></div>
      </div>
      <Footer />
    </main>
  );
}
