import { Metadata } from "next"
import React from "react"

export const metadata: Metadata = {
  title: "Terms of Service - BetterAI",
  description: "Terms of Service for BetterAI by BetterLabs LLC.",
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-lg max-w-none text-foreground dark:prose-invert">
          <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString()}</p>

          <p className="text-sm text-muted-foreground">
            These Terms of Service ("Terms") govern your access to and use of BetterAI (the "Service"), provided by
            BetterLabs LLC ("BetterLabs", "we", "us", or "our"). By accessing or using the Service, you agree to be
            bound by these Terms.
          </p>

          <h2 className="text-2xl font-semibold mt-8">1. The Service</h2>
          <p>
            BetterAI enables users to invoke multiple large language models (LLMs) with enriched datasets to analyze and
            research prediction markets. The Service is for informational and educational purposes only.
          </p>

          <h2 className="text-2xl font-semibold mt-8">2. Eligibility</h2>
          <p>
            You must be capable of forming a binding contract to use the Service and comply with all applicable laws in
            your jurisdiction.
          </p>

          <h2 className="text-2xl font-semibold mt-8">3. Accounts and Security</h2>
          <p>
            If you create an account, you are responsible for maintaining the confidentiality of your credentials and for
            all activities under your account. Notify us immediately of any unauthorized use.
          </p>

          <h2 className="text-2xl font-semibold mt-8">4. Acceptable Use</h2>
          <ul className="list-disc pl-6">
            <li>Do not violate any laws or infringe third-party rights.</li>
            <li>Do not attempt to access the Service by automated means in violation of rate limits.</li>
            <li>Do not interfere with or disrupt the Service&apos;s integrity or performance.</li>
            <li>Do not use the Service to develop models or systems that compete unfairly with BetterAI.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8">5. AI Output; No Advice</h2>
          <p>
            The Service may generate AI-assisted content that can be inaccurate, incomplete, or out of date. We do not
            warrant the accuracy, reliability, or usefulness of any output. The Service does not provide financial,
            investment, legal, or tax advice, and no content should be relied upon as a recommendation to make any trade
            or decision. Markets are volatile and you can lose money. You are solely responsible for your decisions.
          </p>

          <h2 className="text-2xl font-semibold mt-8">6. Third-Party Services</h2>
          <p>
            The Service may integrate with or link to third-party services (including API providers and prediction market
            platforms). We are not responsible for third-party services or their terms.
          </p>

          <h2 className="text-2xl font-semibold mt-8">7. Fees and Credits</h2>
          <p>
            Certain features may require payment or credits. Fees are disclosed at the point of purchase and are
            non-refundable except where required by law.
          </p>

          <h2 className="text-2xl font-semibold mt-8">8. Intellectual Property</h2>
          <p>
            We and our licensors own all rights, title, and interest in and to the Service, including all software,
            content, and trademarks. You receive a limited, revocable, non-exclusive, non-transferable license to use the
            Service in accordance with these Terms.
          </p>

          <h2 className="text-2xl font-semibold mt-8">9. User Content</h2>
          <p>
            If you submit content to the Service, you grant us a worldwide, non-exclusive, royalty-free license to use,
            reproduce, modify, and display that content as necessary to provide and improve the Service. You represent and
            warrant that you have all rights necessary for such content.
          </p>

          <h2 className="text-2xl font-semibold mt-8">10. Beta Features</h2>
          <p>
            We may offer alpha or beta features. These are provided on an "as is" basis for testing and evaluation and
            may be changed or discontinued at any time.
          </p>

          <h2 className="text-2xl font-semibold mt-8">11. Disclaimers</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR
            IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE OR UNINTERRUPTED.
          </p>

          <h2 className="text-2xl font-semibold mt-8">12. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL BETTERLABS LLC OR ITS AFFILIATES BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR
            REVENUES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.
          </p>

          <h2 className="text-2xl font-semibold mt-8">13. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless BetterLabs LLC and its affiliates from any claims, liabilities,
            damages, losses, and expenses, including reasonable attorneys&apos; fees, arising from or related to your use of
            the Service or violation of these Terms.
          </p>

          <h2 className="text-2xl font-semibold mt-8">14. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the jurisdiction in which BetterLabs LLC is organized, without regard
            to its conflict of laws rules, unless a different law is required by applicable regulations.
          </p>

          <h2 className="text-2xl font-semibold mt-8">15. Changes to These Terms</h2>
          <p>
            We may modify these Terms from time to time. Changes are effective when posted. Your continued use of the
            Service after changes become effective constitutes your acceptance of the revised Terms.
          </p>

          <h2 className="text-2xl font-semibold mt-8">16. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time if you violate these Terms or use the
            Service in a way that could cause harm.
          </p>

          <h2 className="text-2xl font-semibold mt-8">17. Contact</h2>
          <p>
            For questions about these Terms, contact us at <a href="mailto:hello@betterai.tools">hello@betterai.tools</a>.
          </p>
        </div>
      </div>
    </div>
  )
}