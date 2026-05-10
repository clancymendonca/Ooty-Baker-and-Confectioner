import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import LegalPage from "@/components/LegalPage";
import { getSiteBaseUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Terms of Service | Ooty Baker & Confectioner",
  description:
    "Terms governing use of the Ooty Baker & Confectioner website and inquiry services.",
};

export const revalidate = 3600;

async function getCategories(): Promise<string[]> {
  try {
    const products = await prisma.product.findMany({
      select: { variety: true },
      distinct: ["variety"],
    });
    return products.map((p) => p.variety).filter((v): v is string => v !== null);
  } catch {
    return [];
  }
}

export default async function TermsPage() {
  const categories = await getCategories();
  const site = getSiteBaseUrl();

  return (
    <LegalPage title="Terms of Service" categories={categories}>
      <p>
        By accessing or using the website at {site} (the &quot;Site&quot;) operated by{" "}
        <strong>Ooty Baker &amp; Confectioner</strong>, you agree to these terms. If you do not
        agree, please do not use the Site.
      </p>
      <h2 className="text-xl font-semibold text-gray-900 pt-4">Use of the Site</h2>
      <p>
        You agree to use the Site only for lawful purposes. You must not attempt to gain
        unauthorized access to any systems, interfere with security features, or misuse inquiry
        or contact forms (including spam or fraudulent submissions).
      </p>
      <h2 className="text-xl font-semibold text-gray-900 pt-4">Products and inquiries</h2>
      <p>
        Information on the Site (including prices, availability, and descriptions) is provided
        for general information and may change without notice. Business inquiries are
        invitations to discuss terms separately; nothing on the Site constitutes a binding offer
        until confirmed by us in writing or as agreed between the parties.
      </p>
      <h2 className="text-xl font-semibold text-gray-900 pt-4">Intellectual property</h2>
      <p>
        Text, images, logos, and layout on the Site are owned by Ooty Baker &amp; Confectioner or
        its licensors. You may not copy or reuse them for commercial purposes without prior
        written permission.
      </p>
      <h2 className="text-xl font-semibold text-gray-900 pt-4">Disclaimer</h2>
      <p>
        The Site is provided &quot;as is&quot; to the extent permitted by law. We do not warrant
        uninterrupted or error-free operation. Your use of the Site is at your own risk.
      </p>
      <h2 className="text-xl font-semibold text-gray-900 pt-4">Limitation of liability</h2>
      <p>
        To the maximum extent permitted by applicable law, Ooty Baker &amp; Confectioner shall
        not be liable for any indirect, incidental, or consequential damages arising from your
        use of the Site.
      </p>
      <h2 className="text-xl font-semibold text-gray-900 pt-4">Governing law</h2>
      <p>
        These terms are governed by the laws of India. Courts at Bengaluru, Karnataka, shall
        have exclusive jurisdiction, subject to mandatory consumer protections where applicable.
      </p>
      <h2 className="text-xl font-semibold text-gray-900 pt-4">Contact</h2>
      <p>
        Questions about these terms:{" "}
        <a href="mailto:info@ootybaker.com" className="text-[#007A4D] underline hover:no-underline">
          info@ootybaker.com
        </a>
        .
      </p>
    </LegalPage>
  );
}
