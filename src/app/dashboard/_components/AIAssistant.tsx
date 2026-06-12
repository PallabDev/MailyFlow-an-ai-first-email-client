'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, ChevronLeft, ChevronRight, ArrowUp } from 'lucide-react';

type AIAssistantProps = {
  user: {
    firstName: string | null;
    lastName: string | null;
  };
};

function formatMessageContent(content: string): React.ReactNode {
  const lines = content.split('\n');

  return lines.map((line, lineIndex) => {
    // If it's a list item (starts with - or * followed by space)
    const isBulletList = /^\s*[-*]\s+(.*)/.exec(line);
    
    // Process markdown formatting inside the text (bold, italic, inline code)
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
          parts.push(<strong key={match.index} className="font-semibold text-slate-900">{innerText}</strong>);
        } else if (token === '*') {
          parts.push(<em key={match.index} className="italic text-slate-800">{innerText}</em>);
        } else if (token === '`') {
          parts.push(<code key={match.index} className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs text-rose-600 border border-slate-200/60">{innerText}</code>);
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
          <li className="text-slate-700">{renderTextWithMarkdown(isBulletList[1])}</li>
        </ul>
      );
    }

    return (
      <p key={lineIndex} className="min-h-[1.25rem] text-slate-700 leading-relaxed">
        {renderTextWithMarkdown(line)}
      </p>
    );
  });
}

export default function AIAssistant({ user }: AIAssistantProps) {
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: `Hello ${user.firstName || 'there'}! I'm your AI Assistant. How can I help you manage your inbox or calendar today?`
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = async (text: string) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user' as const, content: text };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          localTime: new Date().toString(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          const fullContent = data.message.content;
          setChatMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
          
          let currentText = '';
          let index = 0;
          const chunkSize = 2;
          const timer = setInterval(() => {
            if (index < fullContent.length) {
              currentText += fullContent.substring(index, index + chunkSize);
              setChatMessages((prev) => {
                const next = [...prev];
                if (next.length > 0 && next[next.length - 1].role === 'assistant') {
                  next[next.length - 1] = { ...next[next.length - 1], content: currentText };
                }
                return next;
              });
              index += chunkSize;
            } else {
              clearInterval(timer);
            }
          }, 10);
        }
      } else {
        const errData = await res.json();
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ Error: ${errData.error || 'Something went wrong.'}`
          }
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Connection error. Please check your network.' }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <aside className={`border-l border-[#E5E7EB] bg-[#F4F4F5] flex flex-col justify-between transition-all duration-300 relative ${
      isRightSidebarCollapsed ? 'w-12' : 'w-[360px]'
    }`}>
      {/* Toggle Collapse button */}
      <button
        onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
        className="absolute -left-3 top-4 p-1 hover:bg-slate-200 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 transition-all shadow-sm z-30 cursor-pointer"
      >
        {isRightSidebarCollapsed ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>

      {isRightSidebarCollapsed ? (
        /* COLLAPSED ASSISTANT COLUMN */
        <div className="flex flex-col items-center py-6 space-y-6">
          <Sparkles className="h-5 w-5 text-indigo-500" />
        </div>
      ) : (
        /* EXPANDED ASSISTANT SIDEBAR */
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="h-16 px-6 border-b border-[#E5E7EB] flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
              <span className="font-bold text-slate-900 text-sm">AI Assistant</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active</span>
            </div>
          </div>

          {/* Scrollable Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={index}
                  className={`flex flex-col space-y-1 max-w-[85%] ${
                    isAssistant ? 'self-start' : 'self-end ml-auto'
                  }`}
                >
                  <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isAssistant
                      ? 'bg-white border border-[#E5E7EB] text-slate-800'
                      : 'bg-[#E4E9E5] text-slate-800 border border-slate-300/40'
                  }`}>
                    <div className="font-normal space-y-1">
                      {formatMessageContent(msg.content)}
                    </div>
                  </div>
                </div>
              );
            })}
            {chatLoading && (
              <div className="flex items-center space-x-2 text-slate-400 p-2 text-xs font-semibold">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Bottom Actions & Input */}
          <div className="p-4 border-t border-[#E5E7EB] bg-white shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat(chatInput);
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                }
              }}
              className="relative w-full flex flex-col"
            >
              <textarea
                ref={textareaRef}
                rows={3}
                placeholder="Ask anything..."
                value={chatInput}
                onChange={(e) => {
                  setChatInput(e.target.value);
                  if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const isMobile = window.matchMedia('(max-width: 767px)').matches;
                    if (isMobile) {
                      return;
                    }
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSendChat(chatInput);
                      if (textareaRef.current) {
                        textareaRef.current.style.height = 'auto';
                      }
                    }
                  }
                }}
                className="w-full bg-[#F3F4F6] border border-[#D1D5DB] rounded-xl py-2.5 pl-4 pr-12 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-all shadow-inner resize-none overflow-y-auto"
                style={{ minHeight: '60px', maxHeight: '180px' }}
              />
              <button
                type="submit"
                className="absolute right-2.5 bottom-2.5 p-1.5 rounded-full bg-[#3F6257] text-white hover:bg-[#2D473E] transition-all flex items-center justify-center cursor-pointer shadow-sm"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
