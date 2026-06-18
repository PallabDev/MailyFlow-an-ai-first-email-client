'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowUp, Pause, X, Brain, Wrench, Cpu, History, Plus, MessageSquare } from 'lucide-react';
import { useChatStore, ChatMessage } from '@/store/chatStore';
import { motion } from 'motion/react';

type AIAssistantProps = {
    user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
        imageUrl: string;
    };
    projectName: string;
};

// Premium smooth thinking and tool execution agent loader (uses Success color: #6e9b7e)
const AgentProgressLoader = () => {
    const [stage, setStage] = useState(0);

    useEffect(() => {
        const timer1 = setTimeout(() => setStage(1), 2500); // Transition to "selecting tools" at 2.5s
        const timer2 = setTimeout(() => setStage(2), 5500); // Transition to "working" at 5.5s
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    const stages = [
        { text: 'Thinking', icon: <Brain className="h-3.5 w-3.5 text-success animate-pulse shrink-0" /> },
        { text: 'Selecting tools', icon: <Wrench className="h-3.5 w-3.5 text-success shrink-0" /> },
        { text: 'Working', icon: <Cpu className="h-3.5 w-3.5 text-success shrink-0" /> },
    ];

    const currentStage = stages[stage] || stages[0];

    return (
        <div className="flex flex-col space-y-2.5 p-4 bg-card border border-border rounded-2xl w-[170px] shadow-sm transition-all duration-300">
            <div className="flex items-center space-x-2.5">
                {/* Smooth minimal rotating ring spinner */}
                <div className="h-4 w-4 rounded-full border-2 border-[#6e9b7e]/25 border-t-[#6e9b7e] animate-spin shrink-0"></div>
                <span className="text-[11px] font-bold text-text-secondary select-none flex items-center space-x-1.5">
                    {currentStage.icon}
                    <span>{currentStage.text}...</span>
                </span>
            </div>

            {/* Minimal smooth progress bar */}
            <div className="w-full bg-border-row rounded-full h-1 overflow-hidden">
                <div
                    className="bg-success h-1 rounded-full transition-all duration-500 ease-out"
                    style={{ width: stage === 0 ? '30%' : stage === 1 ? '65%' : '90%' }}
                />
            </div>
        </div>
    );
};

// Custom AI Sparkle icon provided by user
const AISvg = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
    <path fillRule="evenodd" clipRule="evenodd" d="M18.5004 10.5254C18.1904 10.5254 17.9004 10.3254 17.8004 10.0354L17.5404 9.33539C17.2304 8.49539 17.0804 8.11539 16.8704 7.89539C16.8704 7.89539 16.8704 7.89539 16.8704 7.89539C16.6704 7.69539 16.3104 7.55541 15.4404 7.23541L14.7504 6.98541C14.4504 6.87541 14.2604 6.5954 14.2504 6.2854C14.2404 5.9754 14.4404 5.68538 14.7404 5.57538L15.4404 5.31537C16.3104 4.99537 16.6704 4.85539 16.8804 4.64539C17.0904 4.43539 17.2304 4.05538 17.5404 3.20538L17.8004 2.51538C17.9104 2.22538 18.1904 2.02539 18.5004 2.02539C18.8104 2.02539 19.0904 2.21538 19.2004 2.51538L19.4604 3.20538C19.7704 4.05538 19.9204 4.4354 20.1304 4.6554C20.3304 4.8554 20.6904 4.99537 21.5604 5.31537L22.2604 5.57538C22.5504 5.68538 22.7504 5.9654 22.7504 6.2854C22.7504 6.6054 22.5504 6.87541 22.2504 6.98541L21.5504 7.23541C20.6904 7.55541 20.3304 7.6954 20.1204 7.9054C19.9104 8.1154 19.7704 8.4954 19.4604 9.3454L19.2004 10.0454C19.0904 10.3354 18.8104 10.5354 18.5004 10.5354V10.5254ZM17.0804 6.26538C17.4204 6.42538 17.6904 6.59538 17.9204 6.82538C18.1604 7.06538 18.3304 7.34536 18.4904 7.68536C18.6504 7.34536 18.8204 7.07539 19.0504 6.83539C19.2904 6.59539 19.5604 6.42538 19.9004 6.26538C19.5604 6.10538 19.2904 5.93538 19.0604 5.70538C18.8204 5.45538 18.6504 5.1854 18.4904 4.8454C18.3304 5.1854 18.1604 5.45537 17.9304 5.69537C17.6904 5.93537 17.4204 6.10538 17.0804 6.26538ZM11.5 23.5254H11.4998C6.83995 23.5254 4.50999 23.5254 2.91 22.1654C1.25 20.7754 1.25 18.6454 1.25 14.7754C1.25 10.9054 1.25 8.76537 2.91 7.37537C4.50997 6.02539 6.84992 6.02539 11.4997 6.02539H11.5C11.91 6.02539 12.25 6.36539 12.25 6.77539C12.25 7.18539 11.91 7.52539 11.5 7.52539H11.4999C7.20996 7.52539 5.05999 7.52539 3.87 8.51538C2.79 9.42538 2.75 10.9954 2.75 14.7754C2.75 18.5554 2.79 20.1154 3.87 21.0254C5.05 22.0254 7.21 22.0254 11.5 22.0254C15.79 22.0254 17.94 22.0254 19.12 21.0254C20.2 20.1154 20.25 18.5454 20.25 14.7754C20.25 13.6254 20.25 12.6354 20.21 11.8154C20.19 11.4054 20.51 11.0454 20.92 11.0254C21.34 11.0054 21.69 11.3254 21.71 11.7354C21.75 12.5954 21.75 13.6054 21.75 14.7754C21.75 18.6454 21.75 20.7754 20.09 22.1654C18.49 23.5254 16.1501 23.5254 11.5002 23.5254H11.5ZM11.25 18.7754C11.25 19.1854 11.59 19.5254 12 19.5254C12.41 19.5254 12.75 19.1854 12.75 18.7754V10.7754C12.75 10.3654 12.41 10.0254 12 10.0254C11.59 10.0254 11.25 10.3654 11.25 10.7754V18.7754ZM9 17.5254C8.59 17.5254 8.25 17.1854 8.25 16.7754V12.7754C8.25 12.3654 8.59 12.0254 9 12.0254C9.41 12.0254 9.75 12.3654 9.75 12.7754V16.7754C9.75 17.1854 9.41 17.5254 9 17.5254ZM5.25 15.7754C5.25 16.1854 5.59 16.5254 6 16.5254C6.41 16.5254 6.75 16.1854 6.75 15.7754V13.7754C6.75 13.3654 6.41 13.0254 6 13.0254C5.59 13.0254 5.25 13.3654 5.25 13.7754V15.7754ZM15 17.5254C14.59 17.5254 14.25 17.1854 14.25 16.7754V12.7754C14.25 12.3654 14.59 12.0254 15 12.0254C15.41 12.0254 15.75 12.3654 15.75 12.7754V16.7754C15.75 17.1854 15.41 17.5254 15 17.5254ZM17.25 15.7754C17.25 16.1854 17.59 16.5254 18 16.5254C18.41 16.5254 18.75 16.1854 18.75 15.7754V13.7754C18.75 13.3654 18.41 13.0254 18 13.0254C17.59 13.0254 17.25 13.3654 17.25 13.7754V15.7754Z" fill="currentColor" />
  </svg>
);

// Helper to convert URLs in plain text into clickable links
function renderLinksAndText(text: string): React.ReactNode[] {
    if (!text) return [];

    const parts: React.ReactNode[] = [];
    let currentIndex = 0;

    // Match markdown links [Link Text](https://example.com)
    const mdLinkRegex = /\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g;
    let match;

    while ((match = mdLinkRegex.exec(text)) !== null) {
        if (match.index > currentIndex) {
            parts.push(...renderRawLinks(text.substring(currentIndex, match.index)));
        }

        const [, linkText, linkUrl] = match;
        parts.push(
            <a
                key={`md-${match.index}`}
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6e9b7e] hover:underline font-semibold"
            >
                {linkText}
            </a>
        );

        currentIndex = mdLinkRegex.lastIndex;
    }

    if (currentIndex < text.length) {
        parts.push(...renderRawLinks(text.substring(currentIndex)));
    }

    return parts;
}

// Inner helper to parse raw links in the rest of the text
function renderRawLinks(text: string): React.ReactNode[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
        if (urlRegex.test(part)) {
            return (
                <a
                    key={`raw-${index}`}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#6e9b7e] hover:underline break-all font-semibold inline-block"
                >
                    {part}
                </a>
            );
        }
        return part;
    });
}

function formatMessageContent(content: string): React.ReactNode {
    if (!content) return null;
    const lines = content.split('\n');

    return lines.map((line, lineIndex) => {
        const isBulletList = /^\s*[-*]\s+(.*)/.exec(line);

        const renderTextWithMarkdown = (text: string) => {
            const parts: React.ReactNode[] = [];
            let currentIndex = 0;
            const tokenRegex = /(\*\*|\*|`)(.*?)\1/g;
            let match;

            while ((match = tokenRegex.exec(text)) !== null) {
                if (match.index > currentIndex) {
                    parts.push(...renderLinksAndText(text.substring(currentIndex, match.index)));
                }

                const [, token, innerText] = match;
                if (token === '**') {
                    parts.push(<strong key={match.index} className="font-bold text-foreground">{renderLinksAndText(innerText)}</strong>);
                } else if (token === '*') {
                    parts.push(<em key={match.index} className="italic text-foreground/90">{renderLinksAndText(innerText)}</em>);
                } else if (token === '`') {
                    parts.push(<code key={match.index} className="bg-background px-1.5 py-0.5 rounded font-mono text-xs text-rose-500 border border-border break-all">{innerText}</code>);
                }

                currentIndex = tokenRegex.lastIndex;
            }

            if (currentIndex < text.length) {
                parts.push(...renderLinksAndText(text.substring(currentIndex)));
            }

            return parts.length > 0 ? parts : text;
        };

        if (isBulletList) {
            return (
                <ul key={lineIndex} className="list-disc pl-5 my-0.5">
                    <li className="text-foreground/80">{renderTextWithMarkdown(isBulletList[1])}</li>
                </ul>
            );
        }

        return (
            <p key={lineIndex} className="min-h-[1.25rem] text-foreground/90 leading-relaxed">
                {renderTextWithMarkdown(line)}
            </p>
        );
    });
}

function Typewriter({ text, speed = 20 }: { text: string; speed?: number }) {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        const words = text.split(' ');
        if (words.length === 0) return;

        setDisplayedText(words[0] || '');
        let index = 0;

        const interval = setInterval(() => {
            index++;
            if (index < words.length) {
                setDisplayedText((prev) => prev + ' ' + words[index]);
            } else {
                clearInterval(interval);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed]);

    return <div className="space-y-1">{formatMessageContent(displayedText)}</div>;
}

// Helper to group messages into sessions based on a 2-hour inactivity gap
function groupMessagesIntoSessions(msgs: ChatMessage[]) {
    if (msgs.length === 0) return [];

    // Ensure messages are sorted by createdAt ascending
    const sortedMsgs = [...msgs].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const sessions: ChatMessage[][] = [];
    let currentSession: ChatMessage[] = [sortedMsgs[0]];

    for (let i = 1; i < sortedMsgs.length; i++) {
        const prevMsg = sortedMsgs[i - 1];
        const currMsg = sortedMsgs[i];

        const prevTime = new Date(prevMsg.createdAt).getTime();
        const currTime = new Date(currMsg.createdAt).getTime();

        // 2 hours threshold in milliseconds = 2 * 60 * 60 * 1000 = 7200000
        if (currTime - prevTime <= 7200000) {
            currentSession.push(currMsg);
        } else {
            sessions.push(currentSession);
            currentSession = [currMsg];
        }
    }

    if (currentSession.length > 0) {
        sessions.push(currentSession);
    }

    // Return sessions sorted descending by their start time (most recent first)
    return sessions.reverse();
}

function getSessionTitle(sessionMessages: ChatMessage[]) {
    const firstUserMsg = sessionMessages.find(m => m.role === 'user');
    if (firstUserMsg && firstUserMsg.content.trim()) {
        const text = firstUserMsg.content.trim();
        return text.length > 40 ? text.substring(0, 40) + '...' : text;
    }
    const firstMsg = sessionMessages[0];
    if (firstMsg && firstMsg.content.trim()) {
        const text = firstMsg.content.trim();
        return text.length > 40 ? text.substring(0, 40) + '...' : text;
    }
    return 'Untitled Chat';
}

function getSessionTimeLabel(date: Date) {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
        return `Today at ${timeStr}`;
    } else if (isYesterday) {
        return `Yesterday at ${timeStr}`;
    } else if (diffDays <= 7) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `${days[date.getDay()]} at ${timeStr}`;
    } else {
        return `${date.toLocaleDateString()} at ${timeStr}`;
    }
}

export default function AIAssistant({ user, projectName: _projectName }: AIAssistantProps) {
    const [isResizing, setIsResizing] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [activeView, setActiveView] = useState<'chat' | 'history'>('chat');

    const {
        messages,
        historyMessages,
        chatLoading,
        chatInput,
        sidebarWidth,
        fetchHistory,
        setMessages,
        sendMessage,
        cancelRequest,
        setSidebarWidth,
        setChatInput,
        clearPolling,
        isRightSidebarCollapsed,
        setIsRightSidebarCollapsed,
    } = useChatStore();

    useEffect(() => {
        let wasDesktop = typeof window !== 'undefined' ? window.innerWidth >= 768 : true;

        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile && wasDesktop) {
                setIsRightSidebarCollapsed(true);
            }
            wasDesktop = !mobile;
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setIsRightSidebarCollapsed]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const isAtBottomRef = useRef(true);

    // Handle scroll events to update isAtBottomRef
    const handleScroll = () => {
        const container = chatContainerRef.current;
        if (!container) return;

        // A threshold of 30px is safe and accounts for subpixel discrepancies or zoom
        const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 30;
        isAtBottomRef.current = atBottom;
    };

    // Load chat messages history on mount
    useEffect(() => {
        setMessages([]);
        fetchHistory(user.id);
        return () => clearPolling();
    }, [user.id, fetchHistory, setMessages, clearPolling]);

    // Handle user messages scroll-to-bottom
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === 'user') {
            isAtBottomRef.current = true;
            const container = chatContainerRef.current;
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }
    }, [messages]);

    // Handle view switching: reset scroll to bottom when entering chat view
    useEffect(() => {
        if (activeView === 'chat') {
            isAtBottomRef.current = true;
            const container = chatContainerRef.current;
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }
    }, [activeView]);

    // Use MutationObserver to scroll to bottom when container contents change
    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        const observer = new MutationObserver(() => {
            if (isAtBottomRef.current) {
                container.scrollTop = container.scrollHeight;
            }
        });

        observer.observe(container, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        return () => observer.disconnect();
    }, []);

    // Handle manual cancel/pause of pending AI request
    const handleCancel = () => {
        const pendingMsg = [...messages].reverse().find((m) => m.role === 'assistant' && m.status === 'pending');
        if (pendingMsg) {
            cancelRequest(pendingMsg.id);
        }
    };

    // Handle mouse drag event for resizable panel
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        const handleMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = window.innerWidth - moveEvent.clientX;
            setSidebarWidth(newWidth);
        };
        const handleMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleSendChat = (text: string) => {
        if (!text.trim()) return;

        // Check if user has credentials
        // Note: in layout.tsx we redirect to onboarding if missing, so they are connected
        sendMessage(
            text,
            user.id,
            Intl.DateTimeFormat().resolvedOptions().timeZone,
            new Date().toString(),
            {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                hasGmailConnection: true,
                hasCalendarConnection: true,
            }
        );
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setActiveView('chat');
    };

    const handleToggleHistory = () => {
        if (activeView === 'history') {
            setActiveView('chat');
        } else {
            setActiveView('history');
            fetchHistory(user.id);
        }
    };

    const handleSelectSession = (sessionMsgs: ChatMessage[]) => {
        setMessages(sessionMsgs);
        setActiveView('chat');
    };

    return (
        <>
            {isResizing && (
                <div className="fixed inset-0 z-[9999] cursor-col-resize bg-transparent select-none pointer-events-auto" />
            )}
            <aside
                style={{ width: isRightSidebarCollapsed ? (isMobile ? '0px' : '48px') : (isMobile ? '100%' : `${sidebarWidth}px`) }}
                className={`border-l border-border bg-sidebar-bg flex flex-col justify-between select-none shrink-0 ${isResizing ? 'transition-none' : 'transition-all duration-300'
                    } ${isRightSidebarCollapsed
                        ? (isMobile ? 'border-l-0 overflow-hidden relative z-30' : 'relative z-30')
                        : (isMobile ? 'fixed inset-0 z-[100] w-full h-full bg-sidebar-bg border-l-0' : 'relative z-30 min-w-[280px] max-w-[600px]')
                    }`}
            >
                {/* Resizable drag handle (visible only when expanded and not on mobile) */}
                {!isRightSidebarCollapsed && !isMobile && (
                    <div
                        onMouseDown={handleMouseDown}
                        className="absolute -left-[2px] top-16 bottom-0 w-[4px] cursor-col-resize hover:bg-success bg-transparent z-40 transition-colors duration-150"
                        title="Drag to resize AI Sidebar"
                    />
                )}

                {/* Toggle Collapse button */}
                {!isMobile && (
                    <button
                        onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                        className="absolute -left-3 top-4 p-1 rounded-full border border-border dark:border-[#3e3e3a] bg-card text-text-secondary hover:text-text-primary hover:bg-hover-row hover:scale-105 transition-all shadow-md z-50 cursor-pointer flex items-center justify-center h-7 w-7"
                        title={isRightSidebarCollapsed ? 'Expand AI Assistant' : 'Collapse AI Assistant'}
                    >
                        {isRightSidebarCollapsed ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                )}

                {isRightSidebarCollapsed ? (
                    /* COLLAPSED ASSISTANT COLUMN */
                    !isMobile && (
                        <div className="flex flex-col items-center py-6 space-y-6">
                            <AISvg className="h-8 w-8 text-[#6e9b7e] shrink-0" />
                        </div>
                    )
                ) : (
                    /* EXPANDED ASSISTANT SIDEBAR */
                    <div className="flex flex-col flex-1 min-h-0 select-text overflow-hidden w-full h-full">
                        {/* Header */}
                        <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-card shrink-0">
                            <div className="flex items-center space-x-2">
                                <AISvg className="h-5.5 w-5.5 text-success shrink-0" />
                                <span className="font-bold text-foreground text-sm">
                                    {activeView === 'history' ? 'Chat History' : 'AI Assistant'}
                                </span>
                            </div>
                            <div className="flex items-center space-x-1">
                                {/* New Chat Button */}
                                <button
                                    onClick={handleNewChat}
                                    className="p-1.5 rounded-lg text-text-secondary hover:bg-sidebar-hover hover:text-text-primary transition-colors cursor-pointer flex items-center justify-center"
                                    title="New Chat"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                                {/* History Toggle Button */}
                                <button
                                    onClick={handleToggleHistory}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${activeView === 'history'
                                        ? 'bg-success/15 text-success'
                                        : 'text-text-secondary hover:bg-sidebar-hover hover:text-text-primary'
                                        }`}
                                    title="Chat History"
                                >
                                    <History className="h-4 w-4" />
                                </button>
                                {/* Close Button */}
                                <button
                                    onClick={() => setIsRightSidebarCollapsed(true)}
                                    className="p-1.5 rounded-lg text-text-secondary hover:bg-sidebar-hover hover:text-text-primary transition-colors cursor-pointer md:hidden flex items-center justify-center"
                                    title="Close AI Assistant"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Chat Area */}
                        <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarGutter: 'stable' }}>
                            {activeView === 'history' ? (
                                <div className="space-y-3">
                                    {groupMessagesIntoSessions(historyMessages).length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                                            <History className="h-8 w-8 text-[#6e9b7e]/40 mb-2 animate-pulse" />
                                            <p className="text-xs">No chat history found.</p>
                                        </div>
                                    ) : (
                                        groupMessagesIntoSessions(historyMessages).map((session, index) => {
                                            const title = getSessionTitle(session);
                                            const timeLabel = getSessionTimeLabel(new Date(session[0].createdAt));

                                            return (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.2, delay: index * 0.03 }}
                                                    onClick={() => handleSelectSession(session)}
                                                    className="p-4 bg-card hover:bg-hover-row border border-border rounded-xl cursor-pointer transition-all duration-200 group flex items-start space-x-3 shadow-sm active:scale-[0.99]"
                                                >
                                                    <MessageSquare className="h-4 w-4 text-[#6e9b7e] shrink-0 mt-0.5" />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-[#6e9b7e] transition-colors">
                                                            {title}
                                                        </h4>
                                                        <p className="text-[11px] text-text-secondary mt-1 flex items-center space-x-1.5">
                                                            <span>{timeLabel}</span>
                                                            <span>•</span>
                                                            <span>{session.length} message{session.length !== 1 ? 's' : ''}</span>
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            ) : (
                                <>
                                    {messages.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                                            <AISvg className="h-10 w-10 text-[#6e9b7e] opacity-75 mb-2.5 animate-pulse shrink-0" />
                                            <p className="text-xs">
                                                Ask me anything about your emails, drafting answers, or scheduling calendar events!
                                            </p>
                                        </div>
                                    )}

                                    {messages.map((msg, index) => {
                                        const isAssistant = msg.role === 'assistant';
                                        const isPending = msg.status === 'pending';
                                        const isCancelled = msg.status === 'cancelled';
                                        const isFailed = msg.status === 'failed';
                                        const isLast = index === messages.length - 1;
                                        const isRecent = new Date().getTime() - new Date(msg.createdAt).getTime() < 12000;

                                        return (
                                            <motion.div
                                                key={msg.clientKey || msg.id || index}
                                                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{ duration: 0.25, ease: [0.215, 0.610, 0.355, 1.000] }}
                                                className={`flex flex-col space-y-1 max-w-[85%] ${isAssistant ? 'self-start' : 'self-end ml-auto'
                                                    }`}
                                            >
                                                <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-200 break-words ${isAssistant
                                                    ? isCancelled
                                                        ? 'bg-danger/10 border border-danger/20 text-danger'
                                                        : isFailed
                                                            ? 'bg-danger/10 border border-danger/20 text-danger'
                                                            : 'bg-card border border-border text-foreground'
                                                    : 'bg-[#e4e9e5] dark:bg-sidebar-active-bg text-slate-800 dark:text-white border border-border'
                                                    }`}>
                                                    {isPending ? (
                                                        <div className="space-y-2.5">
                                                            <AgentProgressLoader />
                                                            {msg.content && (
                                                                <p className="text-[11px] text-text-secondary italic pl-1 animate-pulse select-none leading-normal">
                                                                    {msg.content}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : isAssistant && isLast && isRecent ? (
                                                        <Typewriter text={msg.content || (isFailed ? '⚠️ Failed to do that, please try again later.' : '')} />
                                                    ) : (
                                                        <div className="font-normal space-y-1">
                                                            {formatMessageContent(msg.content || (isFailed ? '⚠️ Failed to do that, please try again later.' : ''))}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Bottom Actions & Input */}
                        {activeView === 'chat' && (
                            <div className="p-4 border-t border-border bg-card shrink-0">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSendChat(chatInput);
                                    }}
                                    className="relative w-full flex flex-col"
                                >
                                    <textarea
                                        ref={textareaRef}
                                        rows={3}
                                        placeholder="Ask anything..."
                                        value={chatInput}
                                        disabled={chatLoading}
                                        onChange={(e) => {
                                            setChatInput(e.target.value);
                                            if (textareaRef.current) {
                                                textareaRef.current.style.height = 'auto';
                                                textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
                                                if (isMobile) {
                                                    return;
                                                }
                                                if (!e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendChat(chatInput);
                                                }
                                            }
                                        }}
                                        className="w-full bg-background border border-border rounded-xl py-2.5 pl-4 pr-12 text-sm text-foreground placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-all shadow-inner resize-none overflow-y-auto"
                                        style={{ minHeight: '90px', maxHeight: '180px' }}
                                    />
                                    {chatLoading ? (
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="absolute right-2.5 bottom-2.5 p-1.5 rounded-full bg-danger hover:bg-danger/80 text-white transition-all flex items-center justify-center cursor-pointer shadow-sm animate-pulse"
                                            title="Pause AI Response"
                                        >
                                            <Pause className="h-3.5 w-3.5" />
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={!chatInput.trim()}
                                            className="absolute right-2.5 bottom-2.5 p-1.5 rounded-full bg-success text-white hover:bg-success/80 transition-all flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Send Message"
                                        >
                                            <ArrowUp className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </form>
                            </div>
                        )}
                    </div>
                )}
            </aside>
        </>
    );
}
