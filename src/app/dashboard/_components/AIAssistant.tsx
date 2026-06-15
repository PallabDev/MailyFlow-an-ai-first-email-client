'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, ArrowUp, XCircle, Pause, X } from 'lucide-react';
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

// Premium non-circular pulsing loading animation (uses Success color: #6e9b7e)
const PremiumPulsingLoader = () => (
  <div className="flex items-center space-x-1.5 p-3.5 bg-card border border-border rounded-2xl max-w-[100px] shadow-sm">
    <div className="h-2 w-2 rounded-full bg-success animate-bounce [animation-delay:-0.3s]"></div>
    <div className="h-2 w-2 rounded-full bg-success animate-bounce [animation-delay:-0.15s]"></div>
    <div className="h-2 w-2 rounded-full bg-success animate-bounce"></div>
  </div>
);

// Helper to convert URLs in plain text into clickable links
function renderLinksAndText(text: string): React.ReactNode[] {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
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

export default function AIAssistant({ user, projectName }: AIAssistantProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const {
    messages,
    chatLoading,
    chatInput,
    sidebarWidth,
    fetchMessages,
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
  
  // Start a fresh AI assistant instance on mount/refresh
  useEffect(() => {
    useChatStore.setState({ messages: [] });
    return () => clearPolling();
  }, []);

  // Smart Auto-Scroll to bottom (only scroll if user is already at the bottom or sent a message)
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const threshold = 150;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;

    const lastMessage = messages[messages.length - 1];
    const isLastMessageUser = lastMessage?.role === 'user';

    if (isNearBottom || isLastMessageUser) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatLoading]);

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

  return (
    <>
      {isResizing && (
        <div className="fixed inset-0 z-[9999] cursor-col-resize bg-transparent select-none pointer-events-auto" />
      )}
      <aside
        style={{ width: isRightSidebarCollapsed ? (isMobile ? '0px' : '48px') : (isMobile ? '100%' : `${sidebarWidth}px`) }}
        className={`border-l border-border bg-sidebar-bg flex flex-col justify-between select-none shrink-0 ${
          isResizing ? 'transition-none' : 'transition-all duration-300'
        } ${
          isRightSidebarCollapsed
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
            <Sparkles className="h-5 w-5 text-[#6e9b7e]" />
          </div>
        )
      ) : (
        /* EXPANDED ASSISTANT SIDEBAR */
        <div className="flex flex-col flex-1 min-h-0 select-text overflow-hidden w-full h-full">
          {/* Header */}
          <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-card shrink-0">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4.5 w-4.5 text-[#6e9b7e]" />
              <span className="font-bold text-foreground text-sm">AI Assistant</span>
            </div>
            {/* Close Button */}
            <button
              onClick={() => setIsRightSidebarCollapsed(true)}
              className="p-1 rounded-lg text-text-secondary hover:bg-sidebar-hover hover:text-text-primary transition-colors cursor-pointer flex items-center justify-center"
              title="Close AI Assistant"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Scrollable Chat Area */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarGutter: 'stable' }}>
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Sparkles className="h-8 w-8 text-[#6e9b7e]/40 mb-2" />
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
                  className={`flex flex-col space-y-1 max-w-[85%] ${
                    isAssistant ? 'self-start' : 'self-end ml-auto'
                  }`}
                >
                  <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-200 break-words ${
                    isAssistant
                      ? isCancelled
                        ? 'bg-danger/10 border border-danger/20 text-danger'
                        : isFailed
                        ? 'bg-danger/10 border border-danger/20 text-danger'
                        : 'bg-card border border-border text-foreground'
                      : 'bg-[#e4e9e5] dark:bg-sidebar-active-bg text-slate-800 dark:text-white border border-border'
                  }`}>
                    {isPending ? (
                      <PremiumPulsingLoader />
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
            
            <div ref={chatEndRef} />
          </div>

          {/* Bottom Actions & Input */}
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
        </div>
      )}
      </aside>
    </>
  );
}
