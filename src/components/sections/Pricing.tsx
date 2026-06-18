"use client";

import { Check } from "lucide-react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import Button from "../ui/Button";
import { useAuth } from "@clerk/nextjs";
import { SpotlightCard } from "../ui/ReactBitsEffects";
import { useRouter } from "next/navigation";

interface Plan {
    name: string;
    price: string;
    priceNote?: string;
    ops: string;
    features: string[];
    cta: string;
    ctaVariant: "primary" | "secondary";
    ctaGlow?: boolean;
    highlighted?: boolean;
}

const PLANS: Plan[] = [
    {
        name: "Starter",
        price: "Free",
        ops: "10 AI operations / day",
        features: [
            "Gmail integration (Manual usage free/unlimited)",
            "Calendar integration (Manual usage free/unlimited)",
            "10 daily AI Operations/calls",
        ],
        cta: "Start free",
        ctaVariant: "secondary",
    },
    {
        name: "Professional",
        price: "\u20B9999",
        priceNote: "/month",
        ops: "50 AI calls / day + 20 summaries + 20 replies",
        features: [
            "Everything in Starter",
            "Smart Workflows & webhooks",
            "50 daily AI Operations/calls",
            "20 AI Email Summaries / day",
            "20 AI Reply Drafts / day",
            "Priority Email Sorting (AI-powered)",
            "Advanced Search Filters",
            "Priority response speed",
        ],
        cta: "Get Professional",
        ctaVariant: "primary",
        ctaGlow: true,
        highlighted: true,
    },
    {
        name: "Business",
        price: "\u20B91999",
        priceNote: "/month",
        ops: "150 AI calls / day + 40 summaries + 40 replies",
        features: [
            "Everything in Pro",
            "Advanced Automation chains",
            "150 daily AI Operations/calls",
            "40 AI Email Summaries / day",
            "40 AI Reply Drafts / day",
            "Priority Email Sorting (AI-powered)",
            "Advanced Search Filters",
            "Dedicated workflow support",
        ],
        cta: "Contact sales",
        ctaVariant: "secondary",
    },
];

export default function Pricing() {
    const { userId } = useAuth();
    const router = useRouter();

    const handleCheckout = async (plan: Plan) => {
        if (plan.name === "Starter") {
            router.push(userId ? "/dashboard" : "/sign-up");
            return;
        }

        if (!userId) {
            // If not logged in, redirect to login page with billing page redirect URL
            const redirectPath = encodeURIComponent("/dashboard/billing");
            router.push(`/sign-in?redirect_url=${redirectPath}`);
            return;
        }

        router.push("/dashboard/billing");
    };

    return (
        <section id="pricing" className="relative py-24 md:py-32">
            {/* Target anchor for payments redirect */}
            <div id="payment" className="absolute -top-20" />


            <Container className="flex flex-col gap-14">
                <SectionHeading
                    eyebrow="Pricing"
                    title="Start free. Scale when it pays for itself."
                    subtitle="We charge strictly for AI calls. Gmail and Calendar manual tool usage is absolutely free & unlimited."
                />

                <div className="grid gap-6 lg:grid-cols-3 lg:items-center">
                    {PLANS.map((plan, i) => (
                        <Reveal key={plan.name} delay={i * 100}>
                            {plan.highlighted ? (
                                <div className="relative lg:scale-[1.04]">
                                    {/* glow behind card */}
                                    <div
                                        aria-hidden
                                        className="animate-glow pointer-events-none absolute -inset-3 -z-10 rounded-xl blur-2xl"
                                        style={{ background: "var(--glow)" }}
                                    />
                                    {/* card */}
                                    <SpotlightCard className="border-accent shadow-[0_4px_24px_-8px_rgba(129,154,145,0.28)] hover:-translate-y-1 hover:shadow-[0_20px_48px_-16px_rgba(129,154,145,0.38)]">
                                        {/* Most popular pill */}
                                        <div className="absolute right-5 top-5 z-20">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-white">
                                                <span className="h-1 w-1 rounded-full bg-white opacity-80" />
                                                Most popular
                                            </span>
                                        </div>
                                        <PlanContent
                                            plan={plan}
                                            onSelect={() => handleCheckout(plan)}
                                        />
                                    </SpotlightCard>
                                </div>
                            ) : (
                                <SpotlightCard className="hover:-translate-y-1 hover:shadow-lg">
                                    <PlanContent
                                        plan={plan}
                                        onSelect={() => handleCheckout(plan)}
                                    />
                                </SpotlightCard>
                            )}
                        </Reveal>
                    ))}
                </div>
            </Container>
        </section>
    );
}

function PlanContent({
    plan,
    onSelect,
}: {
    plan: Plan;
    onSelect: () => void;
}) {
    return (
        <>
            {/* header */}
            <div className="flex flex-col gap-1.5">
                <p className="font-display text-sm font-semibold uppercase tracking-widest text-accent-ink">
                    {plan.name}
                </p>
                <div className="flex items-end gap-1">
                    <span className="font-display text-4xl font-semibold tracking-tight text-text">
                        {plan.price}
                    </span>
                    {plan.priceNote && (
                        <span className="mb-1 text-sm text-muted">{plan.priceNote}</span>
                    )}
                </div>
                {/* ops pill */}
                <span className="mt-1 inline-flex w-fit items-center rounded-full bg-surface2 px-2.5 py-1 text-[11px] font-medium text-muted">
                    {plan.ops}
                </span>
            </div>

            {/* divider */}
            <div className="h-px w-full bg-line" />

            {/* features */}
            <ul className="flex flex-col gap-2.5">
                {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm text-text">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-ink">
                            <Check size={10} strokeWidth={3} />
                        </span>
                        {feat}
                    </li>
                ))}
            </ul>

            {/* CTA */}
            <div className="mt-auto pt-1">
                <Button
                    variant={plan.ctaVariant}
                    glow={plan.ctaGlow}
                    magnetic
                    className="w-full text-center"
                    onClick={onSelect}
                >
                    {plan.cta}
                </Button>
            </div>
        </>
    );
}
