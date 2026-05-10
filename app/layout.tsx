import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import AnimationProvider from "@/components/AnimationProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { getSiteBaseUrl } from "@/lib/site-url";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const siteBaseUrl = getSiteBaseUrl();
const metadataBase = new URL(siteBaseUrl);
const canonicalSiteUrl = new URL("/", metadataBase).href;

export const metadata: Metadata = {
  metadataBase,
  title: "Ooty Baker & Confectioner - Premium Bakery in Bengaluru",
  description: "Welcome to Ooty Baker & Confectioner, your premium bakery in Bommanahalli, Bengaluru. We offer handcrafted Jelly, Candy, and Coated Candy made with love and finest ingredients.",
  keywords: "Ooty Baker, Confectioner, Bakery, Bengaluru, Bommanahalli, Jelly, Candy, Coated Candy, Premium Bakery",
  authors: [{ name: "Ooty Baker & Confectioner" }],
  openGraph: {
    type: "website",
    url: canonicalSiteUrl,
    title: "Ooty Baker & Confectioner - Premium Bakery in Bengaluru",
    description: "Welcome to Ooty Baker & Confectioner, your premium bakery in Bommanahalli, Bengaluru.",
    images: ["/images/brand-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ooty Baker & Confectioner - Premium Bakery in Bengaluru",
    description: "Welcome to Ooty Baker & Confectioner, your premium bakery in Bommanahalli, Bengaluru.",
    images: ["/images/brand-logo.png"],
  },
  icons: {
    icon: "/images/brand-logo.png",
    apple: "/images/brand-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className={poppins.className}>
        <ToastProvider>
          {children}
        </ToastProvider>
        <AnimationProvider />
      </body>
    </html>
  );
}
