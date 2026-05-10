"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";

type DashboardSection = "overview" | "business-inquiries" | "product" | "product-edit" | "banners" | "analytics" | "user-management";

interface DashboardSidebarProps {
  currentSection: DashboardSection;
  setCurrentSection: (section: DashboardSection) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  userRole: string;
}

export default function DashboardSidebar({
  currentSection,
  setCurrentSection,
  isOpen,
  setIsOpen,
  userRole,
}: DashboardSidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth");
    } catch (error) {
      logger.error("Logout error", error);
      router.push("/auth");
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shadow-lg transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          background: "#007A4D" // Ooty Forest Green
        }}
      >
        <div className="h-full flex flex-col overflow-y-auto">
          {/* Logo */}
          <div className="p-6 border-b border-white/10 relative">
            <Link href="/" className="flex items-center justify-center">
              <div className="bg-white/95 rounded-2xl px-4 py-3 shadow-md flex items-center space-x-3">
                <Image
                  src="/images/brand-logo.png"
                  alt="Ooty Baker & Confectioner Logo"
                  width={52}
                  height={52}
                  className="object-contain rounded-xl"
                />
                <Image
                  src="/images/gimmie-logo.jpg"
                  alt="Gimmie Logo"
                  width={72}
                  height={72}
                  className="object-contain rounded-xl"
                />
              </div>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden absolute top-6 right-6 text-white"
            >
              <i className="bx bx-left-arrow-alt text-2xl"></i>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {/* Priority 1: Dashboard Overview - Default landing */}
            <button
              onClick={() => {
                setCurrentSection("overview");
                setIsOpen(false);
              }}
              aria-current={currentSection === "overview" ? "page" : undefined}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentSection === "overview"
                  ? "bg-primary text-white"
                  : "text-white/90 hover:bg-white/10"
              }`}
            >
              <i className="bx bx-home text-xl"></i>
              <span className="font-medium">Dashboard</span>
            </button>

            {/* Divider for core business sections */}
            <div className="pt-2 pb-1">
              <p className="text-xs font-semibold text-white/60 uppercase px-4 mb-2">Core Business</p>
            </div>

            {/* Priority 2: Business Inquiries - Most important */}
            <button
              onClick={() => {
                setCurrentSection("business-inquiries");
                setIsOpen(false);
              }}
              aria-current={currentSection === "business-inquiries" ? "page" : undefined}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentSection === "business-inquiries"
                  ? "bg-primary text-white"
                  : "text-white/90 hover:bg-white/10"
              }`}
            >
              <i className="bx bx-message-dots text-xl"></i>
              <span className="font-medium">Business Inquiries</span>
            </button>

            {/* Priority 3: Products */}
            <button
              onClick={() => {
                setCurrentSection("product-edit");
                setIsOpen(false);
              }}
              aria-current={currentSection === "product-edit" || currentSection === "product" ? "page" : undefined}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentSection === "product-edit" || currentSection === "product"
                  ? "bg-primary text-white"
                  : "text-white/90 hover:bg-white/10"
              }`}
            >
              <i className="bx bx-package text-xl"></i>
              <span className="font-medium">Products</span>
            </button>

            {/* Divider for admin */}
            {(userRole === "developer" || userRole === "admin") && (
              <>
                <div className="pt-2 pb-1">
                  <p className="text-xs font-semibold text-white/60 uppercase px-4 mb-2">Admin</p>
                </div>

                {/* User Management */}
                <button
                  onClick={() => {
                    setCurrentSection("user-management");
                    setIsOpen(false);
                  }}
                  aria-current={currentSection === "user-management" ? "page" : undefined}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    currentSection === "user-management"
                      ? "bg-primary text-white"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  <i className="bx bx-user-plus text-xl"></i>
                  <span className="font-medium">User Management</span>
                </button>
              </>
            )}

            {/* Divider for insights and settings */}
            <div className="pt-2 pb-1">
              <p className="text-xs font-semibold text-white/60 uppercase px-4 mb-2">Insights &amp; Settings</p>
            </div>

            {/* Priority 4: Analytics */}
            <button
              onClick={() => {
                setCurrentSection("analytics");
                setIsOpen(false);
              }}
              aria-current={currentSection === "analytics" ? "page" : undefined}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentSection === "analytics"
                  ? "bg-primary text-white"
                  : "text-white/90 hover:bg-white/10"
              }`}
            >
              <i className="bx bx-line-chart text-xl"></i>
              <span className="font-medium">Analytics</span>
            </button>

            {/* Priority 5: Banners - Least frequently accessed */}
            <button
              onClick={() => {
                setCurrentSection("banners");
                setIsOpen(false);
              }}
              aria-current={currentSection === "banners" ? "page" : undefined}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentSection === "banners"
                  ? "bg-primary text-white"
                  : "text-white/90 hover:bg-white/10"
              }`}
            >
              <i className="bx bx-image text-xl"></i>
              <span className="font-medium">Banners</span>
            </button>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-white/90 hover:bg-white/10 transition-colors"
            >
              <i className="bx bx-log-out bx-flip-horizontal text-xl"></i>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
