"use client";

import Navbar from "../../components/sections/Navbar";
import Footer from "../../components/sections/Footer";
import Container from "../../components/ui/Container";
import GlassCard from "../../components/ui/GlassCard";
import { ThemeProvider } from "../../theme";

export default function RefundsPage() {
  return (
    <ThemeProvider>
      <div className="relative">
        <Navbar />
        <main className="pt-28 pb-16 md:pt-36 md:pb-24">
          <Container className="max-w-4xl">
            <GlassCard className="p-8 md:p-12 flex flex-col gap-8">
              <div className="border-b border-line pb-6">
                <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
                  Cancellation & Refund Policy
                </h1>
                <p className="mt-2 text-sm text-text-muted">
                  Last Updated: June 15, 2026
                </p>
              </div>

              <div className="prose prose-neutral dark:prose-invert max-w-none flex flex-col gap-6 text-text-secondary text-sm md:text-base leading-relaxed">
                <p>
                  Thank you for subscribing to MailyFlow. Because we value transparency, we want to lay out our refund and subscription policies clearly as required for payments processed via Razorpay.
                </p>

                <h2 className="font-display text-xl font-semibold text-text-primary mt-4">
                  1. No-Refund Policy (All Sales are Final)
                </h2>
                <p>
                  MailyFlow operates as a Software-as-a-Service (SaaS) application. Due to the immediate cost of provisioning background listener webhooks, Google API routing slots, and active computational credits for LLM processing:
                </p>
                <p className="font-semibold text-text-primary border-l-2 border-accent pl-4 py-1 bg-surface2 rounded-r-md">
                  We do not offer any refunds or prorated credits for subscriptions purchased. All monthly and annual subscription transactions processed via Razorpay are strictly final and non-refundable.
                </p>

                <h2 className="font-display text-xl font-semibold text-text-primary mt-4">
                  2. Subscription Cancellation
                </h2>
                <p>
                  You are free to cancel your MailyFlow subscription at any time. To cancel:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Navigate to your Workspace Settings dashboard and select the &quot;Billing&quot; tab.</li>
                  <li>Click &quot;Cancel Subscription&quot; to stop billing.</li>
                  <li>Your subscription will remain active, allowing you to use all paid features, until the end of your current billing period. No further charges will be made.</li>
                </ul>

                <h2 className="font-display text-xl font-semibold text-text-primary mt-4">
                  3. Free Tier Availability
                </h2>
                <p>
                  To ensure that MailyFlow meets your workspace requirements before committing financially, we offer a fully featured **Starter Free Plan** (offering 10 daily AI operations). We strongly encourage you to evaluate MailyFlow on the free tier before upgrading to a paid Professional or Business plan.
                </p>

                <h2 className="font-display text-xl font-semibold text-text-primary mt-4">
                  4. Exceptions and Support
                </h2>
                <p>
                  In the rare event of verified billing errors, duplicate transactions, or charge discrepancies, please reach out to our billing team within 7 days of the transaction. We will investigate the issue and coordinate with Razorpay to resolve it where appropriate.
                </p>
                <p>
                  Billing Support Email: <a href="mailto:support@mailyflow.com" className="text-accent hover:underline">support@mailyflow.com</a>
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
