import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - BetterAI",
  description: "Privacy Policy for BetterAI - Learn how we collect, use, and protect your information.",
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-gray max-w-none">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <p className="text-muted-foreground mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <p className="mb-4">
            We collect information you provide directly to us, such as when you use our services, 
            create an account, or contact us for support.
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Account information (email, username)</li>
            <li>Usage data and preferences</li>
            <li>Communication data when you contact us</li>
            <li>Technical information about your device and browser</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p className="mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide and improve our services</li>
            <li>Personalize your experience</li>
            <li>Communicate with you about updates and changes</li>
            <li>Ensure security and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
          <p className="mb-4">
            We do not sell, trade, or otherwise transfer your personal information to third parties 
            except as described in this policy or with your consent.
          </p>
          <p className="mb-4">
            We may share information with:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Service providers who assist in operating our platform</li>
            <li>Legal authorities when required by law</li>
            <li>Business partners with your explicit consent</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p className="mb-4">
            We implement appropriate security measures to protect your personal information against 
            unauthorized access, alteration, disclosure, or destruction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
          <p className="mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of certain communications</li>
            <li>Port your data to another service</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Cookies and Tracking</h2>
          <p className="mb-4">
            We use cookies and similar technologies to enhance your experience, analyze usage patterns, 
            and provide personalized content. You can control cookie settings through your browser preferences.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
          <p className="mb-4">
            Our services are not intended for children under 13. We do not knowingly collect personal 
            information from children under 13. If you believe we have collected such information, 
            please contact us immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes 
            by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="mb-4">
            Email: privacy@betterai.com<br />
            Address: [Your Company Address]
          </p>
        </section>
      </div>
    </div>
  )
} 