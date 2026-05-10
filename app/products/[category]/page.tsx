import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductImage from "@/components/ProductImage";

export const revalidate = 60;

async function getProductsByCategory(category: string) {
  try {
    const decodedCategory = decodeURIComponent(category);
    const products = await prisma.product.findMany({
      where: {
        variety: decodedCategory,
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert Decimal to number for client components
    return products.map((product) => ({
      ...product,
      price: Number(product.price),
      pricePerGram: product.pricePerGram ? Number(product.pricePerGram) : null,
    }));
  } catch (error) {
    logger.error("Error fetching products", error);
    return [];
  }
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: rawCategory } = await params;
  const products = await getProductsByCategory(rawCategory);

  if (products.length === 0) {
    notFound();
  }

  const category = decodeURIComponent(rawCategory);

  return (
    <main className="min-h-screen">
      <Header categories={[category]} />
      {/* Hero Section */}
      <div 
        className="relative pt-32 pb-16 overflow-hidden"
        style={{
          background: "#F9F7F2" // Warm Cream
        }}
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative">
            {/* Category Badge */}
            <div 
              className="inline-block mb-6"
              style={{
                animation: "fadeInUp 0.6s ease-out both",
              }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-heading/10 blur-xl rounded-full"></div>
                <div className="relative bg-white px-8 py-3 rounded-full border-2 border-heading/20 shadow-md">
                  <span className="text-heading font-bold text-sm md:text-base uppercase tracking-widest">{category}</span>
                </div>
              </div>
            </div>

            {/* Main Title */}
            <h1 
              className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-heading mb-5 tracking-tight relative"
              style={{
                animation: "fadeInUp 0.6s ease-out 0.2s both",
              }}
            >
              {category.toUpperCase()}
            </h1>

            {/* Decorative Divider */}
            <div 
              className="flex items-center justify-center gap-4 mb-6"
              style={{
                animation: "fadeInUp 0.6s ease-out 0.4s both",
              }}
            >
              <div className="w-20 h-1 bg-heading/40 rounded-full"></div>
              <div className="w-2.5 h-2.5 bg-heading rounded-full"></div>
              <div className="w-40 h-2 bg-heading/60 rounded-full"></div>
              <div className="w-2.5 h-2.5 bg-heading rounded-full"></div>
              <div className="w-20 h-1 bg-heading/40 rounded-full"></div>
            </div>

            {/* Subtitle */}
            <h2 
              className="text-3xl md:text-4xl lg:text-5xl text-heading font-bold mb-4 relative tracking-wide"
              style={{
                animation: "fadeInUp 0.6s ease-out 0.6s both",
              }}
            >
              Premium Collection
            </h2>

            {/* Description */}
            <p 
              className="text-lg md:text-xl lg:text-2xl text-body/70 max-w-3xl mx-auto leading-relaxed mb-8 relative"
              style={{
                animation: "fadeInUp 0.6s ease-out 0.8s both",
              }}
            >
              Discover our premium collection of handcrafted {category.toLowerCase()} made with love and finest ingredients!
            </p>

            {/* Product Count Badge */}
            <div 
              className="inline-flex items-center justify-center space-x-3 bg-white px-8 py-4 rounded-full border-2 border-heading/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative"
              style={{
                animation: "fadeInUp 0.6s ease-out 1s both",
              }}
            >
              <div className="bg-primary/10 rounded-full p-2">
                <i className="bx bx-package text-2xl md:text-3xl text-primary"></i>
              </div>
              <span className="text-heading font-bold text-base md:text-lg">{products.length} Products Available</span>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="product-view grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10 px-4 sm:px-6 lg:px-8 py-16 max-w-[1400px] mx-auto"
        style={{
          background: "#F9F7F2" // Warm Cream
        }}
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            className="card__article relative bg-white rounded-[40px] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 w-full max-w-[320px] mx-auto"
            style={{
              animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
            }}
          >
            {/* Veg Badge */}
            <div
              className={`veg-badge absolute top-4 right-4 w-10 h-10 rounded-full z-20 flex items-center justify-center shadow-lg ${
                product.vegStatus === "Veg" ? "bg-green-500" : "bg-red-500"
              }`}
              title={product.vegStatus || ""}
            >
              <div className="w-4 h-4 rounded-full bg-white" />
            </div>

            {/* Card Container */}
            <div className="card relative block h-full w-full rounded-[20px] overflow-hidden group">
              {/* Product Image */}
              <div className="relative h-64 md:h-80 w-full overflow-hidden bg-primary-100">
                <ProductImage
                  src={product.imagePath}
                  alt={product.name}
                  width={320}
                  height={320}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 320px"
                  className="card__image w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                
                {/* Product Info Overlay - Appears on Hover */}
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out pointer-events-none">
                  <div className="bg-white rounded-lg p-4 shadow-lg">
                    <h3 className="text-lg font-bold text-heading mb-1 line-clamp-1">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-body/70 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    {product.pricePerGram ? (
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <span className="px-3 py-1.5 text-white bg-primary rounded-lg whitespace-nowrap font-semibold shadow-md">
                          ₹{Number(product.pricePerGram).toFixed(2)}/g
                        </span>
                        <span className="px-3 py-1.5 text-white bg-primary rounded-lg whitespace-nowrap font-semibold shadow-md">
                          ₹{Number(product.price).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm font-medium">
                        <span className="px-4 py-2 text-white bg-primary rounded-lg font-semibold shadow-md">
                          ₹{Number(product.price).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </main>
  );
}
