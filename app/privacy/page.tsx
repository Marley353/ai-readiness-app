import { LegalLayout } from "@/components/landing/legal-layout";

export const metadata = {
  title: "Privacy Policy · AI Readiness",
  description: "How AI Readiness collects, uses and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="16 April 2026">
      <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">1. Summary in plain English</h2>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>Your assessment answers stay <strong>in your browser</strong> (localStorage). They are not transmitted to our servers.</li>
            <li>We use <strong>Clerk</strong> to manage sign-in. Your name and email are stored on Clerk's servers.</li>
            <li>If you upgrade to Pro, <strong>Stripe</strong> processes your payment. We never see or store your card details.</li>
            <li>We <strong>do not sell, rent or share</strong> your personal data with third parties for marketing.</li>
            <li>You can delete your account at any time from the avatar menu.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">2. Who we are</h2>
          <p>
            AI Readiness ("we", "us", "our") is operated by the team behind ai-readiness-app. For questions about this policy or your data, contact us at{" "}
            <a href="mailto:support@aireadiness.app" className="font-semibold text-slate-900 underline hover:text-indigo-600">
              support@aireadiness.app
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">3. What we collect</h2>
          <p className="mb-3">We collect the minimum personal data needed to operate the service:</p>
          <ul className="space-y-1.5 list-disc pl-5">
            <li><strong>Account info</strong> — email, name, profile image (via Clerk) when you sign up.</li>
            <li><strong>Subscription info</strong> — Stripe customer ID, plan, status (via Stripe webhooks) when you upgrade to Pro.</li>
            <li><strong>Usage analytics</strong> — anonymous page-view stats (via Vercel Analytics) to improve the product.</li>
          </ul>
          <p className="mt-3">
            <strong>Your assessment data</strong> — your scores, organisation name, sector, notes — is stored exclusively in your browser's localStorage. It is never transmitted to or stored on our servers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">4. How we use your data</h2>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>To authenticate you and provide access to the app.</li>
            <li>To process your subscription and grant Pro features.</li>
            <li>To send service-related emails (e.g. trial-ending reminders) — never marketing without your explicit opt-in.</li>
            <li>To improve product reliability and performance via aggregate analytics.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">5. Third-party processors</h2>
          <p className="mb-3">We share necessary data only with the following sub-processors:</p>
          <ul className="space-y-1.5 list-disc pl-5">
            <li><strong>Clerk</strong> — authentication. Their privacy policy: <a href="https://clerk.com/privacy" target="_blank" rel="noreferrer" className="font-semibold text-slate-900 underline hover:text-indigo-600">clerk.com/privacy</a></li>
            <li><strong>Stripe</strong> — payment processing. Their privacy policy: <a href="https://stripe.com/privacy" target="_blank" rel="noreferrer" className="font-semibold text-slate-900 underline hover:text-indigo-600">stripe.com/privacy</a></li>
            <li><strong>Vercel</strong> — hosting and anonymous analytics. Their privacy policy: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer" className="font-semibold text-slate-900 underline hover:text-indigo-600">vercel.com/legal/privacy-policy</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">6. Cookies</h2>
          <p>
            We use only essential cookies — these keep you signed in and protect against fraud during checkout. We do not use tracking, advertising or third-party marketing cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">7. Your rights (GDPR / UK GDPR)</h2>
          <p className="mb-3">If you are in the UK or EU, you have the right to:</p>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your data.</li>
            <li>Object to processing or withdraw consent.</li>
            <li>Data portability — receive a copy of your data in a structured format.</li>
            <li>Lodge a complaint with your local supervisory authority (the ICO in the UK).</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, email{" "}
            <a href="mailto:support@aireadiness.app" className="font-semibold text-slate-900 underline hover:text-indigo-600">
              support@aireadiness.app
            </a>
            . We respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">8. Data retention</h2>
          <p>
            We keep your account data for as long as your account is active. If you delete your account, we remove your personal data within 30 days, except where we have a legal obligation to retain it (e.g. invoices for tax purposes).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">9. International transfers</h2>
          <p>
            Our sub-processors (Clerk, Stripe, Vercel) may process your data outside the UK/EU. They each operate under standard contractual clauses (SCCs) and equivalent safeguards approved under GDPR.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">10. Changes to this policy</h2>
          <p>
            We will post any updates to this page with a new "Last updated" date. Material changes will be notified via email if you have an active subscription.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
