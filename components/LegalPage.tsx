import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function LegalPage({
  title,
  categories,
  children,
}: {
  title: string;
  categories: string[];
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#F9F7F2]">
      <Header categories={categories} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">{title}</h1>
        <div className="text-gray-700 leading-relaxed space-y-4 text-base md:text-lg">
          {children}
        </div>
      </article>
      <Footer />
    </main>
  );
}
