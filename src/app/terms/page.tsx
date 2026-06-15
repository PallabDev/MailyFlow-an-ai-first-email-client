"use client";

import Navbar from "../../components/sections/Navbar";
import Footer from "../../components/sections/Footer";
import Container from "../../components/ui/Container";
import GlassCard from "../../components/ui/GlassCard";
import { ThemeProvider } from "../../theme";

export default function TermsPage() {
  return (
    <ThemeProvider>
      <div className="relative">
        <Navbar />
        <main className="pt-28 pb-16 md:pt-36 md:pb-24">
          <Container className="max-w-4xl">
            <GlassCard className="p-8 md:p-12 flex flex-col gap-8">
              <div className="border-b border-line pb-6">
                <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
                  Terms of Service
                </h1>
                <p className="mt-2 text-sm text-text-muted">
                  Last Updated: June 15, 2026
                </p>
              </div>

              <div className="prose prose-neutral dark:prose-invert max-w-none flex flex-col gap-6 text-text-secondary text-sm md:text-base leading-relaxed">
                <p>
                  Welcome to MailyFlow. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of MailyFlow&apos;s website, dashboard, and automation tools. By accessing or using our services, you agree to be bound by these Terms.
                </p>

                <h2 className="font-display text-xl font-semibold text-text-primary mt-4">
                  1. Services Description & Scope
                </h2>
                <p>
                  MailyFlow provides a premium AI-first mail client and dashboard syncing Gmail and Google Calendar operations. Our AI assistant functions as a draft compiler, staging recommendations for you to manually inspect, approve, and send.
                </p>

                <h2 className="font-display text-xl font-semibold text-text-primary mt-4">
                  2. Accounts and Authentication
                </h2>
                <p>
                  To use MailyFlow, you must create an account via Clerk and connect your Google Account via official OAuth credentials. You are responsible for maintaining the confidentiality of your account credentials and for all actions taken under your account.
                </p>

                <h2 className="font-display text-xl font-semibold text-text-primary mt-4">
                  3. Subscriptions, Fees, and Razorpay Transactions
                </h2>
                <p>
                  We offer Free, Professional, and Business tiers.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Billing:</strong> Fees are billed on a recurring monthly or annual subscription cycle.</li>
                  <li><strong>Payment Processing:</strong> All payments are processed securely through our payment integration partner, Razorpay. By upgrading, you agree to their terms and authorize charges.</li>
                  <li><strong>Price Adjustments:</strong> We reserve the right to alter pricing plans, but will notify users 30 days in advance of any changes.</li>
                </ul>

                <h2 className="font-display text-xl font-semibold text-text-primary mt-4">
                  4. Usage Limits & Fair Use
                </h2>
                <p>
                  Each plan carries specific daily limits on AI operations (triage checks, draft compositions, tool lookups). Automated abuse, spam generation, or scripting that compromises MailyFlow infrastructure may result in immediate workspace suspension.
                </p>

                <h2 className="font-display text-xl font-semibold text-text-primary mt-4">
                  5. No-Refund Policy
                </h2>
                <p>
                  Due to the immediate provisioning of LLM computational credits and sync webhooks, <strong>all sales are final and MailyFlow does not offer refunds</strong>. Please see our Refund Policy for complete information.
                </p>

                <h2 className="font-display text-xl font-semibold text-text-primary mt-4">
                  6. Disclaimers & Limitation of Liability
                </h2>
                <p>
                  MailyFlow is provided &ldquo;as is&rdquo; without warranties of any kind. Since AI models can occasionally hallucinate, MailyFlow requires human-in-the-loop validation for all outbound emails. We are not liable for any messages sent, events modified, or damages resulting from unchecked AI drafts.
                </p>

                <h2 className="font-display text-xl font-semibold text-text-primary mt-4">
                  7. Governing Law
                </h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles. Any dispute arising out of these Terms shall be resolved in courts located in India.
                </p>

                <h2 className="font-display text-xl font-semibold text-text-primary mt-4">
                  8. Changes to Terms
                </h2>
                <p>
                  We reserve the right to modify these Terms. Your continued use of the platform after updates indicates acceptance of the revised Terms.
                </p>

                <h2 className="font-display text-xl font-semibold text-text-primary mt-4">
                  9. Contact Us
                </h2>
                <p>
                  For any legal concerns or service support, contact:
                  <br />
                  Email: <a href="mailto:support@mailyflow.com" className="text-accent hover:underline">support@mailyflow.com</a>
                </p>
              </div>
            </GlassCard>
          </Container>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
