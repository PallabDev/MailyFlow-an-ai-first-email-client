'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, ArrowUp, XCircle } from 'lucide-react';
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
          parts.push(text.substring(currentIndex, match.index));
        }
        
        const [, token, innerText] = match;
        if (token === '**') {
          parts.push(<strong key={match.index} className="font-bold text-foreground">{innerText}</strong>);
        } else if (token === '*') {
          parts.push(<em key={match.index} className="italic text-foreground/90">{innerText}</em>);
        } else if (token === '`') {
          parts.push(<code key={match.index} className="bg-background px-1.5 py-0.5 rounded font-mono text-xs text-rose-500 border border-border">{innerText}</code>);
        }
        
        currentIndex = tokenRegex.lastIndex;
      }
      
      if (currentIndex < text.length) {
        parts.push(text.substring(currentIndex));
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
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
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
  } = useChatStore();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Start a fresh AI assistant instance on mount/refresh
  useEffect(() => {
    useChatStore.setState({ messages: [] });
    return () => clearPolling();
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        style={{ width: isRightSidebarCollapsed ? '48px' : `${sidebarWidth}px` }}
        className={`border-l border-border bg-sidebar-bg flex flex-col justify-between relative select-none shrink-0 ${
          isResizing ? 'transition-none' : 'transition-all duration-300'
        } ${isRightSidebarCollapsed ? '' : 'min-w-[280px] max-w-[600px]'}`}
      >
        {/* Resizable drag handle (visible only when expanded) */}
        {!isRightSidebarCollapsed && (
          <div
            onMouseDown={handleMouseDown}
            className="absolute -left-[2px] top-16 bottom-0 w-[4px] cursor-col-resize hover:bg-success bg-transparent z-40 transition-colors duration-150"
            title="Drag to resize AI Sidebar"
          />
        )}

      {/* Toggle Collapse button */}
      <button
        onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
        className="absolute -left-3 top-4 p-1 hover:bg-sidebar-hover rounded-full border border-border bg-card text-slate-500 hover:text-foreground transition-all shadow-sm z-50 cursor-pointer"
        title={isRightSidebarCollapsed ? 'Expand AI Assistant' : 'Collapse AI Assistant'}
      >
        {isRightSidebarCollapsed ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>

      {isRightSidebarCollapsed ? (
        /* COLLAPSED ASSISTANT COLUMN */
        <div className="flex flex-col items-center py-6 space-y-6">
          <Sparkles className="h-5 w-5 text-[#6e9b7e]" />
        </div>
      ) : (
        /* EXPANDED ASSISTANT SIDEBAR */
        <div className="flex flex-col flex-1 min-h-0 select-text">
          {/* Header */}
          <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-card shrink-0">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4.5 w-4.5 text-[#6e9b7e]" />
              <span className="font-bold text-foreground text-sm">AI Assistant</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="h-2 w-2 rounded-full bg-[#6e9b7e] animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Active</span>
            </div>
          </div>

          {/* Scrollable Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: [0.215, 0.610, 0.355, 1.000] }}
                  className={`flex flex-col space-y-1 max-w-[85%] ${
                    isAssistant ? 'self-start' : 'self-end ml-auto'
                  }`}
                >
                  <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-200 ${
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
                      <Typewriter text={msg.content} />
                    ) : (
                      <div className="font-normal space-y-1">
                        {formatMessageContent(msg.content)}
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
            {/* Active AI thinking state pause/cancel prompt */}
            {chatLoading && (
              <div className="flex items-center justify-between bg-warning/10 border border-warning/20 px-3 py-1.5 rounded-xl text-xs text-warning mb-2 animate-pulse">
                <div className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning"></span>
                  <span>Generating response...</span>
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-danger hover:bg-danger/80 text-white font-bold cursor-pointer transition-colors shadow-sm"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Pause AI</span>
                </button>
              </div>
            )}

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
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="absolute right-2.5 bottom-2.5 p-1.5 rounded-full bg-success text-white hover:bg-success/80 transition-all flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send Message"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
      </aside>
    </>
  );
}
