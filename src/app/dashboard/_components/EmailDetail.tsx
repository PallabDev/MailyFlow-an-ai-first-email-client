'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RefreshCw, AlertCircle, CornerUpLeft, Send, Paperclip, X, Sparkles } from 'lucide-react';
import { getEmailHtml, parseSender, getInitials, getAvatarColor, formatEmailDate, isRichHtml } from '@/utils/emailHelper';
import { useChatStore } from '@/store/chatStore';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import AISvg from './AISvg';

type Email = {
    id: string;
    from: string;
    date: string;
    subject: string;
    snippet: string;
    body: string;
    labelIds?: string[];
    attachments?: Array<{
        name: string;
        type: string;
        base64: string;
        size?: number;
    }>;
};

type EmailDetailProps = {
    email: Email;
    onBack: () => void;
    onTrash: (id: string) => void;
    onStar?: (id: string) => void;
};

export default function EmailDetail({
    email,
}: EmailDetailProps) {
    const [detailEmail, setDetailEmail] = useState<Email | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [iframeHeight, setIframeHeight] = useState('500px');

    // Reply Form states
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [replyAttachments, setReplyAttachments] = useState<Array<{ name: string; type: string; base64: string; size: number }>>([]);
    const replyFileInputRef = useRef<HTMLInputElement>(null);

    // Billing & Plan checks
    const pathname = usePathname();
    const router = useRouter();
    const [checkingPlan, setCheckingPlan] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // AI Summary state
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [summaryContent, setSummaryContent] = useState('');
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryDragPosition, setSummaryDragPosition] = useState({ x: 0, y: 0 });
    const [summaryDragging, setSummaryDragging] = useState(false);
    const [summaryDragStart, setSummaryDragStart] = useState({ x: 0, y: 0 });

    // AI Reply state
    const [draftingReply, setDraftingReply] = useState(false);

    const { theme } = useChatStore();

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (window.innerWidth < 768) return;
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;

        setSummaryDragging(true);
        setSummaryDragStart({
            x: e.clientX - summaryDragPosition.x,
            y: e.clientY - summaryDragPosition.y,
        });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!summaryDragging) return;
        const newX = e.clientX - summaryDragStart.x;
        const newY = e.clientY - summaryDragStart.y;
        setSummaryDragPosition({ x: newX, y: newY });
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!summaryDragging) return;
        setSummaryDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    // Reply Attachments handling
    const handleReplyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            filesArray.forEach((file) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result as string;
                    setReplyAttachments((prev) => [
                        ...prev,
                        {
                            name: file.name,
                            type: file.type,
                            base64: base64,
                            size: file.size,
                        },
                    ]);
                };
                reader.readAsDataURL(file);
            });
            e.target.value = '';
        }
    };

    const triggerReplyFileInput = () => {
        replyFileInputRef.current?.click();
    };

    const removeReplyAttachment = (idx: number) => {
        setReplyAttachments((prev) => prev.filter((_, i) => i !== idx));
    };

    // Send Reply
    const handleSendReply = async () => {
        if (!replyText.trim()) return;
        setSendingReply(true);
        try {
            const recipient = parseSender(email.from).email || email.from;
            const cleanSubject = email.subject.toLowerCase().startsWith('re:')
                ? email.subject
                : `Re: ${email.subject}`;

            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: recipient,
                    subject: cleanSubject,
                    body: replyText,
                    attachments: replyAttachments,
                }),
            });

            if (res.ok) {
                toast.success('Reply sent successfully!', {
                    className: 'bg-card text-text-primary border border-border shadow-md rounded-xl text-sm font-medium',
                    icon: null,
                });
                setReplyText('');
                setReplyAttachments([]);
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || 'Failed to send reply.', {
                    className: 'bg-card text-text-primary border border-border shadow-md rounded-xl text-sm font-medium',
                    icon: null,
                });
            }
        } catch {
            toast.error('Failed to send reply due to network error.', {
                className: 'bg-card text-text-primary border border-border shadow-md rounded-xl text-sm font-medium',
                icon: null,
            });
        } finally {
            setSendingReply(false);
        }
    };

    // Fetch plan status
    const getSubscriptionPlan = async (): Promise<'Starter' | 'Professional' | 'Business'> => {
        try {
            const res = await fetch('/api/billing/status');
            if (res.ok) {
                const data = await res.json();
                return data.subscription?.planName || 'Starter';
            }
        } catch (err) {
            console.error('Failed to fetch plan:', err);
        }
        return 'Starter';
    };

    // AI Summary execution
    const handleSummarize = async () => {
        setCheckingPlan(true);
        const plan = await getSubscriptionPlan();
        setCheckingPlan(false);

        if (plan === 'Starter') {
            setShowUpgradeModal(true);
            return;
        }

        setSummaryOpen(true);
        setSummaryContent('');
        setSummaryLoading(true);
        setSummaryDragPosition({ x: 0, y: 0 });

        try {
            const res = await fetch('/api/emails/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailId: email.id }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setSummaryContent(`⚠️ ${data.error || 'Failed to initiate summarization.'}`);
                setSummaryLoading(false);
            }
        } catch (err) {
            console.error(err);
            setSummaryContent('⚠️ Connection error. Summarization failed.');
            setSummaryLoading(false);
        }
    };

    // AI Auto-Reply Generation
    const handleAIDraftReply = async () => {
        setCheckingPlan(true);
        const plan = await getSubscriptionPlan();
        setCheckingPlan(false);

        if (plan === 'Starter') {
            setShowUpgradeModal(true);
            return;
        }

        setDraftingReply(true);
        try {
            const res = await fetch('/api/emails/draft-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailId: email.id }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || 'Failed to generate AI response draft.', {
                    className: 'bg-card text-text-primary border border-border shadow-md rounded-xl text-sm font-medium',
                });
                setDraftingReply(false);
            }
        } catch (err) {
            console.error(err);
            toast.error('Connection error generating AI draft.', {
                className: 'bg-card text-text-primary border border-border shadow-md rounded-xl text-sm font-medium',
            });
            setDraftingReply(false);
        }
    };

    // Socket listeners for summaries (emitted via global sockets or simulated in demo)
    useEffect(() => {
        const handleSummaryReady = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.emailId === email.id) {
                setSummaryContent(customEvent.detail.summary || '');
                setSummaryLoading(false);
            }
        };

        const handleSummaryFailed = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.emailId === email.id) {
                setSummaryContent(`⚠️ ${customEvent.detail.error || 'Failed to generate summary.'}`);
                setSummaryLoading(false);
            }
        };

        window.addEventListener('mailyflow-summary-ready', handleSummaryReady);
        window.addEventListener('mailyflow-summary-failed', handleSummaryFailed);
        window.addEventListener('mailyflow-demo-summary-ready', handleSummaryReady);

        return () => {
            window.removeEventListener('mailyflow-summary-ready', handleSummaryReady);
            window.removeEventListener('mailyflow-summary-failed', handleSummaryFailed);
            window.removeEventListener('mailyflow-demo-summary-ready', handleSummaryReady);
        };
    }, [email.id]);

    // Socket listeners for reply drafts
    useEffect(() => {
        const handleDraftReady = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.emailId === email.id) {
                setReplyText(customEvent.detail.text || '');
                setDraftingReply(false);
                toast.success('AI response draft ready!', {
                    className: 'bg-card text-text-primary border border-border shadow-md rounded-xl text-sm font-medium',
                });
            }
        };

        const handleDraftFailed = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.emailId === email.id) {
                toast.error(customEvent.detail.error || 'Failed to generate AI response draft.', {
                    className: 'bg-card text-text-primary border border-border shadow-md rounded-xl text-sm font-medium',
                });
                setDraftingReply(false);
            }
        };

        window.addEventListener('mailyflow-draft-ready', handleDraftReady);
        window.addEventListener('mailyflow-draft-failed', handleDraftFailed);
        window.addEventListener('mailyflow-demo-draft-ready', handleDraftReady);

        return () => {
            window.removeEventListener('mailyflow-draft-ready', handleDraftReady);
            window.removeEventListener('mailyflow-draft-failed', handleDraftFailed);
            window.removeEventListener('mailyflow-demo-draft-ready', handleDraftReady);
        };
    }, [email.id]);

    useEffect(() => {
        if (!email) return;

        if (email.body) {
            setDetailEmail(email);
            setLoading(false);
            return;
        }

        const fetchDetail = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/emails/detail?id=${email.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setDetailEmail(data);
                } else {
                    const data = await res.json();
                    setError(data.error || 'Failed to load email body.');
                }
            } catch (err) {
                console.error('Error fetching email details:', err);
                setError('Connection error loading email.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [email.id]);

    useEffect(() => {
        if (detailEmail && email && email.id === detailEmail.id) {
            setDetailEmail((prev) => prev ? { ...prev, labelIds: email.labelIds } : null);
        }
    }, [email.labelIds]);

    const iframeRef = React.useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (iframeRef.current && e.source === iframeRef.current.contentWindow) {
                if (e.data && e.data.type === 'resize-iframe') {
                    setIframeHeight(`${e.data.height}px`);
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [detailEmail]);

    const emailHtml = useMemo(() => {
        if (!detailEmail) return '';
        return getEmailHtml(detailEmail, true, theme);
    }, [detailEmail?.id, detailEmail?.body, theme]);

    const isHtmlEmail = useMemo(() => {
        if (!detailEmail) return false;
        return isRichHtml(detailEmail.body);
    }, [detailEmail?.body]);

    const containerClassName = useMemo(() => {
        return isHtmlEmail
            ? "bg-white text-black rounded-xl border border-border p-1 md:p-4"
            : theme === 'dark'
                ? "bg-card text-text-primary rounded-xl border border-[#3e3e3a] p-1 md:p-4"
                : "bg-white text-text-primary rounded-xl border border-border p-1 md:p-4";
    }, [isHtmlEmail, theme]);

    const iframeClassName = useMemo(() => {
        return isHtmlEmail
            ? "w-full border-0 overflow-hidden bg-white"
            : theme === 'dark'
                ? "w-full border-0 overflow-hidden bg-[#161613]"
                : "w-full border-0 overflow-hidden bg-white";
    }, [isHtmlEmail, theme]);

    const iframeStyle = useMemo(() => {
        return {
            height: iframeHeight,
            colorScheme: isHtmlEmail ? 'light only' : (theme === 'dark' ? 'dark only' : 'light only')
        };
    }, [isHtmlEmail, theme, iframeHeight]);

    const sender = parseSender(email.from);

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background text-text-primary relative">

            {/* 1. UPGRADE PLAN MODAL POPUP */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-[110] bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-6 text-text-primary space-y-4 animate-zoom-in">
                        <div className="flex items-center space-x-2.5 text-warning">
                            <AISvg className="h-6 w-6 text-warning" />
                            <span className="font-bold text-base">Premium AI Feature</span>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed font-semibold">
                            AI Summaries and replies generation are paid features. Upgrade your plan to get unlimited smart tools, schedule syncs, and AI assistants.
                        </p>
                        <div className="flex items-center justify-end space-x-3 pt-2">
                            <button
                                onClick={() => setShowUpgradeModal(false)}
                                className="px-4 py-2 border border-border rounded-xl text-xs font-bold text-text-secondary hover:bg-hover-row transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowUpgradeModal(false);
                                    const base = pathname?.startsWith('/demo') ? '/demo' : '/dashboard';
                                    router.push(`${base}/billing`);
                                }}
                                className="px-5 py-2 bg-success text-white rounded-xl text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm"
                            >
                                Upgrade Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. DRAGGABLE SUMMARY POPUP WINDOW */}
            {summaryOpen && (
                <div className="fixed md:pointer-events-none inset-0 z-[95] flex items-center justify-center p-4 md:p-0 md:bg-transparent md:backdrop-blur-none bg-black/35 backdrop-blur-xs">
                    <div
                        style={
                            window.innerWidth >= 768
                                ? {
                                    transform: `translate(${summaryDragPosition.x}px, ${summaryDragPosition.y}px)`,
                                    position: 'fixed',
                                    top: '90px',
                                    right: '24px',
                                }
                                : undefined
                        }
                        className="bg-card border border-border rounded-2xl w-full max-w-sm md:w-[350px] shadow-2xl pointer-events-auto select-text text-text-primary flex flex-col overflow-hidden animate-zoom-in"
                    >
                        {/* Header (Draggable on Desktop) */}
                        <div
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            className="h-12 border-b border-border px-4 flex items-center justify-between bg-surface-subtle md:cursor-move select-none"
                        >
                            <div className="flex items-center space-x-1.5 font-bold text-xs uppercase tracking-wider text-text-primary">
                                <AISvg className="h-4.5 w-4.5 text-success" />
                                <span>AI Summary</span>
                            </div>
                            <button
                                onClick={() => setSummaryOpen(false)}
                                className="p-1 rounded-lg hover:bg-sidebar-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                            >
                                <X className="h-4.5 w-4.5" />
                            </button>
                        </div>

                        {/* Content body */}
                        <div className="p-4 text-sm leading-relaxed max-h-[300px] overflow-y-auto space-y-3 font-semibold select-text">
                            {summaryLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-3 select-none">
                                    <div className="h-5 w-5 rounded-full border-2 border-success/30 border-t-success animate-spin"></div>
                                    <span className="text-xs text-text-secondary font-bold animate-pulse">Summarizing...</span>
                                </div>
                            ) : (
                                <div className="whitespace-pre-line text-text-secondary">
                                    {summaryContent || 'No summary text generated.'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. EMAIL DETAIL PAGE HEADER */}
            <div className="flex-1 overflow-y-auto px-[2.5%] py-3 md:p-6 space-y-4 md:space-y-6">
                <div className="space-y-4 shrink-0">
                    <div className="flex items-start justify-between gap-4">
                        <h2 className="text-xl font-extrabold text-text-primary leading-snug break-words [word-break:break-word] flex-1">
                            {email.subject}
                        </h2>

                        {/* SUMMARIZE AI BUTTON IN HEADER */}
                        <button
                            onClick={handleSummarize}
                            disabled={checkingPlan}
                            className="shrink-0 inline-flex items-center space-x-1 px-3.5 py-1.5 border border-success/30 hover:border-success/60 bg-success/5 hover:bg-success/10 text-success text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
                        >
                            {checkingPlan ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <AISvg className="h-4 w-4" />
                            )}
                            <span>Summarize</span>
                        </button>
                    </div>

                    <div className="flex items-center space-x-3 bg-surface-subtle p-2 md:p-4 rounded-xl border border-border">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${getAvatarColor(email.from)}`}>
                            {getInitials(email.from)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-text-secondary font-semibold leading-none">From</p>
                            <p className="text-sm font-bold text-text-primary truncate leading-none mt-1">
                                {sender.name}
                            </p>
                            <p className="text-[10px] text-text-muted dark:text-text-secondary break-all mt-1">
                                {sender.email}
                            </p>
                        </div>
                    </div>

                    <div className="text-xs text-text-muted font-medium">
                        Date: <span className="font-semibold text-text-secondary">{formatEmailDate(email.date)}</span>
                    </div>
                </div>

                {/* Message Details with Rich Text Render */}
                <div className="border-t border-border pt-6">
                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-text-muted mb-3">Message Body</h4>

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-3">
                            <div className="flex items-center space-x-1.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-success animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="h-2.5 w-2.5 rounded-full bg-success animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="h-2.5 w-2.5 rounded-full bg-success animate-bounce"></div>
                            </div>
                            <span className="text-xs text-text-secondary">Loading email body...</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-start space-x-2 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {!loading && !error && detailEmail && (
                        <>
                            <div className={containerClassName}>
                                <iframe
                                    ref={iframeRef}
                                    srcDoc={emailHtml}
                                    style={iframeStyle}
                                    className={iframeClassName}
                                    scrolling="no"
                                    title="Email Body Content"
                                    sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
                                />
                            </div>

                            {/* Attachments Section */}
                            {detailEmail.attachments && detailEmail.attachments.length > 0 && (
                                <div className="border-t border-border pt-4 mt-4 select-none">
                                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-text-muted mb-2.5">Attachments ({detailEmail.attachments.length})</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {detailEmail.attachments.map((file, idx) => (
                                            <a
                                                key={`detail-file-${idx}`}
                                                href={file.base64}
                                                download={file.name}
                                                className="flex items-center space-x-2 bg-surface-subtle hover:bg-hover-row text-text-primary px-3.5 py-2 rounded-xl border border-border text-xs font-semibold cursor-pointer transition-all decoration-none active:scale-95"
                                            >
                                                <Paperclip className="h-4 w-4 text-slate-500 shrink-0" />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="truncate max-w-[180px] leading-tight text-text-primary font-bold">{file.name}</span>
                                                    {file.size && (
                                                        <span className="text-[9px] text-text-muted font-normal mt-0.5">({(file.size / 1024).toFixed(1)} KB)</span>
                                                    )}
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Inline Reply Form */}
                            <div className="border-t border-border pt-4 md:pt-6 mt-6">
                                <h4 className="text-[10px] uppercase font-bold tracking-wider text-text-muted mb-3 flex items-center space-x-1">
                                    <CornerUpLeft className="h-3.5 w-3.5 text-text-muted" />
                                    <span>Reply</span>
                                </h4>
                                <div className="bg-card border border-border rounded-xl p-3 md:p-4 space-y-4">
                                    <div className="flex items-center justify-between text-xs text-text-secondary">
                                        <span>Replying to: <strong>{sender.email || email.from}</strong></span>
                                    </div>

                                    {/* Reply Input */}
                                    <textarea
                                        rows={4}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type your reply here..."
                                        disabled={sendingReply || draftingReply}
                                        className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground focus:outline-none focus:border-slate-500 transition-all shadow-inner resize-none"
                                    />

                                    {/* Hidden input for reply attachments */}
                                    <input
                                        type="file"
                                        ref={replyFileInputRef}
                                        onChange={handleReplyFileChange}
                                        multiple
                                        className="hidden"
                                    />

                                    {/* Reply Attachments List */}
                                    {replyAttachments.length > 0 && (
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Attachments ({replyAttachments.length})</span>
                                            <div className="flex flex-wrap gap-2 pr-1 max-h-20 overflow-y-auto select-none">
                                                {replyAttachments.map((file, idx) => (
                                                    <div
                                                        key={`reply-file-${idx}`}
                                                        className="flex items-center space-x-1.5 bg-sidebar-hover text-text-primary px-2.5 py-1 rounded-lg border border-border text-xs font-semibold animate-zoom-in"
                                                    >
                                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                                        <span className="text-text-muted text-[10px] font-normal">({(file.size / 1024).toFixed(1)} KB)</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeReplyAttachment(idx)}
                                                            className="text-text-muted hover:text-danger p-0.5 rounded cursor-pointer transition-colors"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        {/* Left: Attach file in reply */}
                                        <button
                                            onClick={triggerReplyFileInput}
                                            disabled={sendingReply || draftingReply}
                                            className="inline-flex items-center space-x-1 px-3 py-2 border border-border rounded-xl text-xs font-bold text-text-secondary hover:bg-hover-row transition-all cursor-pointer bg-card disabled:opacity-50"
                                        >
                                            <Paperclip className="h-4 w-4 text-slate-500" />
                                            <span>Attach files</span>
                                        </button>

                                        {/* Right: Send reply & AI draft buttons */}
                                        <div className="flex items-center space-x-3">
                                            {/* AI REPLY DRAFT BUTTON (Paid plans only) */}
                                            <button
                                                onClick={handleAIDraftReply}
                                                disabled={sendingReply || draftingReply || checkingPlan}
                                                className="inline-flex items-center space-x-1 px-3.5 py-2 border border-success/30 hover:border-success/60 bg-success/5 hover:bg-success/10 text-success text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
                                                title="Draft reply using AI"
                                            >
                                                {draftingReply ? (
                                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <AISvg className="h-3.5 w-3.5" />
                                                )}
                                                <span>AI Draft</span>
                                            </button>

                                            <button
                                                onClick={handleSendReply}
                                                disabled={sendingReply || draftingReply || !replyText.trim()}
                                                className="inline-flex items-center space-x-1.5 rounded-xl bg-success px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {sendingReply ? (
                                                    <>
                                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                                        <span>Sending...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="h-3 w-3" />
                                                        <span>Send Reply</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
