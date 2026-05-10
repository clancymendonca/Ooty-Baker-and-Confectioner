import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Ooty Baker",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
