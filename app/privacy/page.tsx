import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import LegalPage from "@/components/LegalPage";
import { getSiteBaseUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Privacy Policy | Ooty Baker & Confectioner",
  description:
    "How Ooty Baker & Confectioner collects, uses, and protects your information when you use our website and services.",
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

export default async function PrivacyPage() {
  const categories = await getCategories();
  const site = getSiteBaseUrl();

  return (
    <LegalPage title="Privacy Policy" categories={categories}>
      <p>
        This policy describes how <strong>Ooty Baker &amp; Confectioner</strong> (&quot;we&quot;,
        &quot;us&quot;) handles information when you visit our website ({site}) or submit a
        business inquiry.
      </p>
      <h2 className="text-xl font-semibold text-gray-900 pt-4">Information we collect</h2>
      <p>
        When you use our inquiry form or contact us, we may collect your name, business name,
        email address, phone number, address, product interests, and any notes you choose to
        provide. We also receive standard technical data from your browser (such as IP address
        and user agent) through our hosting and security systems where applicable.
      </p>
      <h2 className="text-xl font-semibold text-gray-900 pt-4">How we use your information</h2>
      <p>
        We use this information to respond to inquiries, fulfil orders or sampling requests,
        improve our products and service, and comply with legal obligations. We do not sell your
        personal information.
      </p>
      <h2 className="text-xl font-semibold text-gray-900 pt-4">Retention</h2>
      <p>
        We retain inquiry and account-related records only as long as needed for business,
        accounting, or legal purposes, unless a longer period is required by law.
      </p>
      <h2 className="text-xl font-semibold text-gray-900 pt-4">Your choices</h2>
      <p>
        You may contact us at{" "}
        <a href="mailto:info@ootybaker.com" className="text-[#007A4D] underline hover:no-underline">
          info@ootybaker.com
        </a>{" "}
        to ask about the data we hold about you or to request correction or deletion where
        applicable.
      </p>
      <h2 className="text-xl font-semibold text-gray-900 pt-4">Updates</h2>
      <p>
        We may update this policy from time to time. The &quot;last updated&quot; notion is the
        date you see in your deployment; material changes will be reflected on this page.
      </p>
    </LegalPage>
  );
}
