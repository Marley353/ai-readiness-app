import { LegalLayout } from "@/components/landing/legal-layout";

export const metadata = {
  title: "Terms of Service · AI Readiness",
  description: "The terms governing your use of AI Readiness.",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="16 April 2026">
      <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">1. Acceptance</h2>
          <p>
            By accessing or using AI Readiness ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">2. The Service</h2>
          <p>
            AI Readiness provides an online assessment tool that helps organisations evaluate their readiness for AI adoption across eight dimensions. We may update, change or discontinue any feature of the Service at any time.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">3. Accounts</h2>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>You must provide accurate information when registering and keep your credentials secure.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">4. Subscriptions, billing & trials</h2>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>Pro plans are paid subscriptions billed monthly or annually as selected.</li>
            <li>All Pro plans include a <strong>7-day free trial</strong>. You will not be charged during the trial. To avoid being charged, cancel before the trial ends.</li>
            <li>Subscriptions auto-renew at the end of each billing period unless cancelled.</li>
            <li>You can cancel any time from your account page. Cancellation takes effect at the end of the current paid period — no refunds for partial periods.</li>
            <li>Prices may change. We will give you at least 30 days' notice of any price increase before it affects your renewal.</li>
            <li>Payment is processed by Stripe. You are subject to Stripe's terms in addition to ours.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">5. Acceptable use</h2>
          <p className="mb-3">You agree NOT to:</p>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>Use the Service for any unlawful purpose or in breach of any applicable law or regulation.</li>
            <li>Attempt to access, reverse-engineer, decompile or interfere with the Service or its underlying systems.</li>
            <li>Resell or redistribute access to the Service without a written agreement.</li>
            <li>Use the Service to transmit malware or send unsolicited communications.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">6. Your content</h2>
          <p>
            You retain ownership of all assessment data you create (scores, organisation name, sector, notes). Because this data is stored locally in your browser and never reaches our servers, we have no copy of it. You are responsible for backing up your assessments by exporting PDFs or saving the JSON.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">7. Intellectual property</h2>
          <p>
            The Service, including its branding, design, framework, code and content, is owned by us or our licensors. We grant you a limited, non-exclusive, non-transferable, revocable licence to use the Service for its intended purpose during the term of your subscription.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">8. The 8-dimension framework</h2>
          <p>
            The framework, weights and recommendations contained in the Service are provided for informational purposes only. They synthesise published industry standards and best practice but should not replace professional advice tailored to your specific circumstances. We make no warranty as to the suitability of the Service for any particular business decision.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">9. Disclaimers</h2>
          <p>
            The Service is provided <strong>"as is"</strong> and <strong>"as available"</strong>, without warranties of any kind, whether express or implied, including but not limited to merchantability, fitness for a particular purpose and non-infringement. We do not warrant that the Service will be uninterrupted, error-free or secure.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">10. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, our total aggregate liability arising out of or related to the Service shall not exceed the amounts paid by you to us in the 12 months preceding the claim. We are not liable for indirect, incidental, special, consequential or punitive damages, including lost profits, lost data or business interruption.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">11. Termination</h2>
          <p>
            You may terminate your account at any time. We may terminate or suspend your access if you breach these Terms or use the Service in a way that risks harm to other users or to us. Upon termination, your right to use the Service ceases immediately.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">12. Governing law</h2>
          <p>
            These Terms are governed by the laws of England and Wales. Disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">13. Changes to these Terms</h2>
          <p>
            We may revise these Terms from time to time. The "Last updated" date at the top reflects the most recent revision. Material changes will be notified via email if you have an active subscription. Continued use of the Service after changes constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">14. Contact</h2>
          <p>
            For any questions, email{" "}
            <a href="mailto:support@aireadiness.app" className="font-semibold text-slate-900 underline hover:text-indigo-600">
              support@aireadiness.app
            </a>
            .
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
