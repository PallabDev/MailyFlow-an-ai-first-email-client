"use client";

import Navbar from "../../components/sections/Navbar";
import Footer from "../../components/sections/Footer";
import Container from "../../components/ui/Container";
import GlassCard from "../../components/ui/GlassCard";
import { ThemeProvider } from "../../theme";

export default function PrivacyPage() {
  return (
    <ThemeProvider>
      <div className="relative">
        <Navbar />
        <main className="pt-28 pb-16 md:pt-36 md:pb-24">
          <Container className="max-w-4xl">
            <GlassCard className="p-8 md:p-12 flex flex-col gap-8">
              <div className="border-b border-line pb-6">
                <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
                  Privacy Policy
                </h1>
                <p className="mt-2 text-sm text-text-muted">
                  Last Updated: June 15, 2026
                </p>
              </div>

              <div className="prose prose-neutral dark:prose-invert max-w-none flex flex-col gap-6 text-text-secondary text-sm md:text-base leading-relaxed">
                <p>
                  At MailyFlow, we value your trust and are committed to protecting your privacy. This Privacy Policy describes how we handle, process, and protect your information when you use our website, application, and AI integration services.
                </p>

                <h2 className="font-display text-xl font-semibold text-text-primary mt-4">
                  1. Google API Scopes & OAuth Integration
                </h2>
                <p>
                  MailyFlow integrates directly with your Google Accounts (Gmail and Google Calendar) using official Google OAuth 2.0 credentials. Our service requires specific scopes to function as a client interface:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Gmail Scopes:</strong> To fetch, search, label, compose, stage, and dispatch email drafts.</li>
                  <li><strong>Google Calendar Scopes:</strong> To view, sync, and manage calendar events.</li>
                </ul>
                <p>
                  <strong>Important:</strong> MailyFlow does not store, clone, or index your private emails or calendar event contents on our database servers. Data is processed locally on your client app and dispatched securely through official Google APIs.
                </p>

                <h2 className="font-display text-xl font-semibold text-text-primary mt-4">
                  2. Information We Collect
                </h2>
                <p>
                  We collect only the minimum required info to maintain your account:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Account Data:</strong> Name, email address, and authentication details processed securely through our authentication provider (Clerk).</li>
                  <li><strong>Integration Tokens:</strong> Scoped OAuth tokens required to communicate directly with Google API on your behalf. These tokens are encrypted both in transit and at rest.</li>
                  <li><strong>Usage Metadata:</strong> Basic subscription details and count of daily AI operations for pricing plan limits validation.</li>
                </ul>

                <h2 className="font-display text-xl font-semibold text-text-primary mt-4">
                  3. How We Use Your Information
                </h2>
                <p>
                  Your information is strictly used to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide and maintain your MailyFlow workspace.</li>
                  <li>Enable our AI co-pilot to parse queries and draft responses for your approval.</li>
                  <li>Process payments and subscriptions securely.</li>
                </ul>

                <h2 className="font-display text-xl font-semibold text-text-primary mt-4">
                  4. Data Sharing and Third Parties
                </h2>
                <p>
                  We do not sell, trade, or share your data with advertisers or brokers. Your data is only processed by:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Google Services:</strong> Directly via OAuth request endpoints.</li>
                  <li><strong>AI Processing (Optional):</strong> Large Language Model APIs (e.g. OpenAI) only receive the context necessary to formulate drafts and schedule slots based on your command. We strictly do not allow AI partners to use your data for model training.</li>
                  <li><strong>Payment Gateway:</strong> Payment processing handled entirely by Razorpay.</li>
                </ul>

                <h2 className="font-display text-xl font-semibold text-text-primary mt-4">
                  5. Data Security and Deletion
                </h2>
                <p>
                  We implement robust, enterprise-grade encryption methods. You can revoke Google OAuth access at any time via your Google Security portal or delete your MailyFlow account from your dashboard settings, which permanently wipes all active credentials.
                </p>

                <h2 className="font-display text-xl font-semibold text-text-primary mt-4">
                  6. Contact Information
                </h2>
                <p>
                  For any privacy questions or to request data deletion, contact us at:
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
