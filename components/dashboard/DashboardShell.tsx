"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import BusinessInquiries from "@/components/dashboard/BusinessInquiries";
import ProductManagement from "@/components/dashboard/ProductManagement";
import BannerManagement from "@/components/dashboard/BannerManagement";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import Analytics from "@/components/dashboard/Analytics";
import UserManagement from "@/components/dashboard/UserManagement";

type DashboardSection = "overview" | "business-inquiries" | "product" | "product-edit" | "banners" | "analytics" | "user-management";

const DASHBOARD_SECTIONS: DashboardSection[] = [
  "overview",
  "business-inquiries",
  "product",
  "product-edit",
  "banners",
  "analytics",
  "user-management",
];

function isDashboardSection(value: string | null): value is DashboardSection {
  return value !== null && DASHBOARD_SECTIONS.includes(value as DashboardSection);
}

interface DashboardShellProps {
  user: { id: number; email: string; role: string };
}

/**
 * Client shell for the dashboard. Auth is enforced upstream by the server
 * component (see app/dashboard/page.tsx) and by middleware, so this component
 * only handles section state and URL sync.
 */
export default function DashboardShell({ user: _user }: DashboardShellProps) {
  const [currentSection, setCurrentSection] = useState<DashboardSection>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sectionFromUrl = params.get("section");
    if (isDashboardSection(sectionFromUrl)) {
      setCurrentSection(sectionFromUrl);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("section", currentSection);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [currentSection]);

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        userRole={_user.role}
      />
      <div className="flex-1 flex flex-col lg:ml-64">
        <DashboardHeader setIsSidebarOpen={setIsSidebarOpen} currentSection={currentSection} />
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-background">
          {currentSection === "overview" && (
            <DashboardOverview onNavigate={setCurrentSection} />
          )}
          {currentSection === "business-inquiries" && <BusinessInquiries />}
          {(currentSection === "product" || currentSection === "product-edit") && (
            <ProductManagement />
          )}
          {currentSection === "banners" && <BannerManagement />}
          {currentSection === "analytics" && <Analytics />}
          {currentSection === "user-management" && (_user.role === "developer" || _user.role === "admin") && <UserManagement userRole={_user.role} />}
        </main>
      </div>
    </div>
  );
}
