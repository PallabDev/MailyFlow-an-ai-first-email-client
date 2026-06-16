'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Sparkles, Mail, Calendar as CalendarIcon, CheckCircle2, XCircle, RefreshCw, ArrowUpRight } from 'lucide-react';

type SubscriptionData = {
  planName: string;
  status: string;
  price: string;
  startDate: string | null;
  endDate: string | null;
};

type UsageData = {
  ai: number;
  gmail: number;
  calendar: number;
  limits: {
    aiLimit: number;
    gmailLimit: number;
    calendarLimit: number;
  };
};

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    ops: "10 AI operations / day",
    features: [
      "Gmail integration (Manual usage free/unlimited)",
      "Calendar integration (Manual usage free/unlimited)",
      "10 daily AI Operations/calls",
    ],
  },
  {
    name: "Professional",
    price: "₹599",
    priceNote: "/month",
    ops: "30 AI operations / day",
    features: [
      "Everything in Starter",
      "Smart Workflows & webhooks",
      "30 daily AI Operations/calls",
      "Priority response speed",
    ],
  },
  {
    name: "Business",
    price: "₹999",
    priceNote: "/month",
    ops: "100 AI operations / day",
    features: [
      "Everything in Pro",
      "Advanced Automation chains",
      "100 daily AI Operations/calls",
      "Dedicated workflow support",
    ],
  },
];

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchBillingStatus = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/billing/status');
      if (res.ok) {
        const data = await res.json();
        setSubData(data.subscription);
        setUsageData(data.usage);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || 'Failed to retrieve billing metrics.');
      }
    } catch (err) {
      console.error('Error fetching billing details:', err);
      setErrorMsg('Could not sync current billing status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingStatus();
  }, []);

  const handleCancelPlan = async () => {
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel your paid plan? You will retain access to your plan features until the end of the current billing cycle.'
    );
    if (!confirmCancel) return;

    setCancelling(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(data.message);
        await fetchBillingStatus();
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || 'Failed to cancel plan subscription.');
      }
    } catch (err) {
      console.error('Error cancelling plan:', err);
      setErrorMsg('An error occurred while cancelling your plan.');
    } finally {
      setCancelling(false);
    }
  };

  const handleUpgrade = async (planName: string) => {
    if (planName === "Starter") return;

    setUpgradingPlan(planName);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setErrorMsg("Failed to load payment gateways. Please verify your connection.");
        setUpgradingPlan(null);
        return;
      }

      // 2. Create Razorpay order on the server
      const orderRes = await fetch("/api/billing/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json();
        setErrorMsg(errData.error || "Failed to initiate transaction.");
        setUpgradingPlan(null);
        return;
      }

      const orderData = await orderRes.json();

      // 3. Configure Razorpay Standard Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "MailyFlow",
        description: `${planName} Plan Subscription`,
        image: "/icon.png",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          setUpgradingPlan("Verifying...");
          try {
            const verifyRes = await fetch("/api/billing/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planName,
              }),
            });

            if (verifyRes.ok) {
              setSuccessMsg(`Successfully subscribed to the ${planName} plan!`);
              await fetchBillingStatus();
            } else {
              const errVerify = await verifyRes.json();
              setErrorMsg(errVerify.error || "Payment verification failed.");
            }
          } catch (verifyErr) {
            console.error("Payment verification request failed:", verifyErr);
            setErrorMsg("Payment verification request failed.");
          } finally {
            setUpgradingPlan(null);
          }
        },
        prefill: {
          name: "",
          email: "",
        },
        theme: {
          color: "#5f7a68",
        },
        modal: {
          ondismiss: function () {
            setUpgradingPlan(null);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (checkoutErr) {
      console.error("Checkout process failed:", checkoutErr);
      setErrorMsg("Checkout process encountered an error.");
      setUpgradingPlan(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const calculatePercentage = (current: number, limit: number) => {
    if (limit <= 0) return 0;
    return Math.min(Math.round((current / limit) * 100), 100);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background text-text-primary">
      {/* Billing Header */}
      <div className="h-16 px-6 border-b border-border flex items-center justify-between shrink-0 bg-card">
        <div className="flex items-center space-x-3">
          <CreditCard className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h1 className="text-lg font-bold text-text-primary">Billing & Quota Settings</h1>
        </div>
        <button
          onClick={fetchBillingStatus}
          disabled={loading}
          className={`p-1.5 text-text-secondary hover:text-text-primary hover:bg-sidebar-hover rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
            loading ? 'animate-spin opacity-50' : ''
          }`}
          title="Refresh billing details"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {errorMsg && (
          <div className="flex items-start space-x-2.5 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-600 text-sm font-medium">
            <XCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start space-x-2.5 p-4 rounded-xl border border-success/20 bg-success/5 text-success text-sm font-medium">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-success" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading && !subData ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-40 bg-card border border-border rounded-2xl"></div>
            <div className="h-60 bg-card border border-border rounded-2xl"></div>
          </div>
        ) : (
          subData && usageData && (
            <>
              {/* Subscription Detail Card */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">Subscription Details</h2>
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-black text-text-primary tracking-tight">{subData.planName}</span>
                        {subData.status === 'active' && (
                          <span className="text-xs font-semibold bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                        {subData.status === 'cancelled' && (
                          <span className="text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full animate-pulse">
                            Cancelled
                          </span>
                        )}
                        {subData.status === 'inactive' && (
                          <span className="text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 px-2 py-0.5 rounded-full">
                            Starter Free
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary">
                        {subData.planName === 'Starter'
                          ? 'You are currently utilizing MailyFlow\'s free tier resources. Upgrade to access premium daily AI volumes.'
                          : `Billed at ${subData.price}/month via Razorpay security gateway.`}
                      </p>
                      {subData.endDate && (
                        <p className="text-xs text-text-muted">
                          {subData.status === 'cancelled'
                            ? `Your plan cancellation is pending cycle end. Premium access will expire on ${formatDate(subData.endDate)}.`
                            : `Next invoice renewal date is scheduled for ${formatDate(subData.endDate)}.`}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 flex flex-col items-start md:items-end gap-2.5">
                      {subData.status === 'active' && (
                        <button
                          onClick={handleCancelPlan}
                          disabled={cancelling}
                          className="rounded-xl border border-danger/25 text-danger hover:bg-danger/10 px-5 py-2.5 text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                        </button>
                      )}
                      {(subData.planName === 'Starter' || subData.status === 'cancelled') && (
                        <a
                          href="#upgrade-section"
                          className="inline-flex items-center space-x-1.5 rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-accent/90 hover:shadow-sm active:scale-95"
                        >
                          <span>{subData.status === 'cancelled' ? 'Resume Subscription' : 'Upgrade Plan'}</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Plans Section */}
              <div id="upgrade-section" className="space-y-4 pt-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">Available Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {PLANS.map((p) => {
                    const isCurrentPlan = subData.planName.toLowerCase() === p.name.toLowerCase();
                    const isActive = subData.status === 'active';
                    const isCancelled = subData.status === 'cancelled';
                    
                    let btnText = `Upgrade to ${p.name}`;
                    let btnDisabled = false;
                    
                    if (isCurrentPlan) {
                      if (isActive) {
                        btnText = "Current Active Plan";
                        btnDisabled = true;
                      } else if (isCancelled) {
                        btnText = "Reactivate Plan";
                      }
                    } else if (p.name === 'Starter') {
                      btnText = "Starter Free Plan";
                      btnDisabled = true;
                    } else if (subData.planName === 'Business' && p.name === 'Professional') {
                      btnText = "Included in current tier";
                      btnDisabled = true;
                    }
                    
                    const isHighlighted = p.name === 'Professional';

                    return (
                      <div
                        key={p.name}
                        className={`flex flex-col rounded-2xl border p-6 bg-card transition-all relative ${
                          isHighlighted
                            ? 'border-accent shadow-md shadow-accent/5 ring-1 ring-accent/25'
                            : 'border-border shadow-sm'
                        }`}
                      >
                        {isHighlighted && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase select-none">
                            Most Popular
                          </span>
                        )}
                        
                        <div className="space-y-1.5 mb-5">
                          <h3 className="text-base font-bold text-text-primary">{p.name}</h3>
                          <div className="flex items-baseline space-x-1">
                            <span className="text-2xl font-black text-text-primary tracking-tight">{p.price}</span>
                            {p.priceNote && <span className="text-xs text-text-muted">{p.priceNote}</span>}
                          </div>
                          <p className="text-xs text-text-muted font-medium">{p.ops}</p>
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-between">
                          <ul className="space-y-2.5 mb-6">
                            {p.features.map((f, idx) => (
                              <li key={idx} className="flex items-start space-x-2 text-xs text-text-secondary leading-relaxed">
                                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                          
                          <button
                            onClick={() => handleUpgrade(p.name)}
                            disabled={btnDisabled || upgradingPlan !== null}
                            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${
                              isCurrentPlan && isCancelled
                                ? 'bg-success text-white hover:bg-success/90'
                                : isHighlighted
                                ? 'bg-accent text-white hover:bg-accent/90 hover:shadow-sm'
                                : 'bg-surface-subtle border border-border text-text-secondary hover:bg-hover-row hover:text-text-primary'
                            }`}
                          >
                            {upgradingPlan === p.name ? (
                              <div className="flex items-center justify-center space-x-1">
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                <span>Processing...</span>
                              </div>
                            ) : (
                              btnText
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Usage & Limits Progress Bars */}
              <div className="space-y-4 pt-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">Daily Operation Limits</h2>
                <div className="bg-card border border-border rounded-2xl p-6 space-y-8 shadow-sm">
                  {/* AI Calls Usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm font-bold text-text-primary">
                        <Sparkles className="h-4.5 w-4.5 text-accent" />
                        <span>AI Assistant Operations</span>
                      </div>
                      <span className="text-xs font-semibold text-text-secondary">
                        {usageData.ai} / {usageData.limits.aiLimit} calls
                      </span>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="h-2.5 w-full bg-surface-subtle border border-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{ width: `${calculatePercentage(usageData.ai, usageData.limits.aiLimit)}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-text-muted leading-relaxed">
                      AI calls count requests routed to the Copilot assistant including MCP planning queries. Quota resets daily at midnight.
                    </p>
                  </div>

                  {/* Gmail Usage */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm font-bold text-text-primary">
                        <Mail className="h-4.5 w-4.5 text-danger" />
                        <span>Manual Gmail Actions</span>
                      </div>
                      <span className="text-xs font-semibold text-text-secondary">
                        {usageData.gmail} / {usageData.limits.gmailLimit} calls
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2.5 w-full bg-surface-subtle border border-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-400 dark:bg-slate-600 rounded-full transition-all duration-500"
                        style={{ width: `${calculatePercentage(usageData.gmail, usageData.limits.gmailLimit)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-text-muted leading-relaxed">
                      <span>Refreshes, details fetch, sends, or deletes processed manually.</span>
                      <span className="text-success font-semibold bg-success/10 px-1.5 py-0.5 rounded-full select-none shrink-0 ml-2">
                        Free & Unlimited (500 daily anti-spam cap)
                      </span>
                    </div>
                  </div>

                  {/* Calendar Usage */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm font-bold text-text-primary">
                        <CalendarIcon className="h-4.5 w-4.5 text-accent" />
                        <span>Manual Google Calendar Actions</span>
                      </div>
                      <span className="text-xs font-semibold text-text-secondary">
                        {usageData.calendar} / {usageData.limits.calendarLimit} calls
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2.5 w-full bg-surface-subtle border border-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-400 dark:bg-slate-600 rounded-full transition-all duration-500"
                        style={{ width: `${calculatePercentage(usageData.calendar, usageData.limits.calendarLimit)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-text-muted leading-relaxed">
                      <span>Event CRUD syncs or monthly grid fetches processed manually.</span>
                      <span className="text-success font-semibold bg-success/10 px-1.5 py-0.5 rounded-full select-none shrink-0 ml-2">
                        Free & Unlimited (500 daily anti-spam cap)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
