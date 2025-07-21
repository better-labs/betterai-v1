import React from "react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">Terms of Service (Draft)</h1>
        <div className="prose prose-lg mx-auto text-gray-700">
          <p><strong>Last updated:</strong> [Date]</p>
          <p>
            Welcome to BetterAI! This is a draft of our Terms of Service. By using our website, you agree to the following terms. Please review them carefully.
          </p>
          <ol className="list-decimal pl-6">
            <li>
              <strong>Use of Service:</strong> You agree to use BetterAI for lawful purposes only and not to misuse the service in any way.
            </li>
            <li>
              <strong>Intellectual Property:</strong> All content and materials on BetterAI are the property of their respective owners.
            </li>
            <li>
              <strong>No Financial Advice:</strong> Information provided by BetterAI is for informational purposes only and does not constitute financial, investment, or legal advice.
            </li>
            <li>
              <strong>Limitation of Liability:</strong> BetterAI is provided "as is" without warranties of any kind. We are not liable for any damages arising from the use of our service.
            </li>
            <li>
              <strong>Changes to Terms:</strong> We may update these Terms of Service at any time. Continued use of the service constitutes acceptance of the new terms.
            </li>
          </ol>
          <p>
            For questions or concerns, please contact us at <a href="mailto:support@betterai.com">support@betterai.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
} 