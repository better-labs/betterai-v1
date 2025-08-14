import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - BetterAI",
  description: "Privacy Policy for BetterAI by BetterLabs LLC — how we collect, use, and protect your information.",
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-gray max-w-none">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <p className="text-muted-foreground mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <p className="text-sm text-muted-foreground mb-8">
          This Privacy Policy describes how BetterLabs LLC ("BetterLabs", "we", "us" or "our") collects, uses, and shares
          information in connection with the BetterAI product (the "Service"). By using the Service, you agree to the
          collection and use of information in accordance with this policy.
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
            <li>Log data (IP address, request metadata, timestamps)</li>
            <li>Cookies and similar technologies as described below</li>
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
            <li>Research and develop new features and to evaluate model and system performance</li>
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
            <li>Analytics and infrastructure providers that process data on our behalf under contractual safeguards</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p className="mb-4">
            We implement appropriate security measures to protect your personal information against 
            unauthorized access, alteration, disclosure, or destruction.
          </p>
          <p className="text-sm text-muted-foreground">
            No method of transmission over the Internet or method of electronic storage is 100% secure. While we strive
            to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute
            security.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
          <p className="mb-4">
            We retain personal information for as long as necessary to provide the Service, comply with our legal
            obligations, resolve disputes, and enforce our agreements. We may retain aggregated or de-identified data for
            research and analytics purposes.
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
          <p className="text-sm text-muted-foreground">
            To exercise these rights, contact us at <a href="mailto:hello@betterai.tools">hello@betterai.tools</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Cookies and Tracking</h2>
          <p className="mb-4">
            We use cookies and similar technologies to enhance your experience, analyze usage patterns, 
            and provide personalized content. You can control cookie settings through your browser preferences.
          </p>
          <p className="text-sm text-muted-foreground">
            We may also use third-party analytics tools that collect information sent by your device or our Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Children&apos;s Privacy</h2>
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
            by posting the new policy on this page and updating the &quot;Last updated&quot; date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="mb-4">
            Email: <a href="mailto:hello@betterai.tools">hello@betterai.tools</a><br />
            Company: BetterLabs LLC
          </p>
          <p className="text-sm text-muted-foreground">
            If you reside in a region with specific data protection laws, you may have additional rights under those
            laws. We will comply with applicable legal requirements when processing your information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">No Financial Advice</h2>
          <p className="mb-4">
            BetterAI is a research and analysis tool. We do not provide financial, investment, legal, or tax advice.
            Any information or content provided by the Service is for informational purposes only and should not be
            construed as a recommendation to engage in any transaction or investment strategy.
          </p>
        </section>
      </div>
    </div>
  )
} 