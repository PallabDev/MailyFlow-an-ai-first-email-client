'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, ChevronLeft, ChevronRight, ArrowUp } from 'lucide-react';

type AIAssistantProps = {
  user: {
    firstName: string | null;
    lastName: string | null;
  };
};

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
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setChatMessages((prev) => [...prev, data.message]);
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
                    <p className="whitespace-pre-line font-normal">{msg.content}</p>
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
