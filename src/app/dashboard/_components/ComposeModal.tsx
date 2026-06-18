'use client';

import React, { useState, useRef } from 'react';
import { X, Send, CheckCircle2, AlertCircle, Info as InfoIcon, Minus, Paperclip } from 'lucide-react';
import { useComposeStore } from '@/store/composeStore';
import { motion, useDragControls } from 'motion/react';

export default function ComposeModal() {
  const {
    isOpen,
    isMinimized,
    to,
    subject,
    body,
    attachments,
    closeCompose,
    minimizeCompose,
    restoreCompose,
    setTo,
    setSubject,
    setBody,
    addAttachment,
    removeAttachment,
    clearCompose,
  } = useComposeStore();

  const [sendingEmail, setSendingEmail] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          addAttachment({
            name: file.name,
            type: file.type,
            base64: base64,
            size: file.size,
          });
        };
        reader.readAsDataURL(file);
      });
      // Reset input value so same file can be attached again if deleted
      e.target.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject || !body) return;
    setSendingEmail(true);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          body,
          attachments,
        }),
      });

      if (res.ok) {
        showToast('Email sent successfully!', 'success');
        clearCompose();
        // Trigger labels count update and list refreshes
        window.dispatchEvent(new CustomEvent('refresh-labels'));
        setTimeout(() => {
          closeCompose();
        }, 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Failed to send email', 'error');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      showToast('Failed to send email.', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!to || !subject || !body) {
      showToast('Please fill out all fields before saving a draft.', 'info');
      return;
    }
    setSavingDraft(true);
    try {
      const res = await fetch('/api/save-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          body,
          attachments,
        }),
      });

      if (res.ok) {
        showToast('Draft saved successfully!', 'success');
        clearCompose();
        // Trigger labels count update and email list refresh
        window.dispatchEvent(new CustomEvent('refresh-labels'));
        setTimeout(() => {
          closeCompose();
        }, 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Failed to save draft', 'error');
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      showToast('Failed to save draft.', 'error');
    } finally {
      setSavingDraft(false);
    }
  };

  if (!isOpen) return null;

  // Active / Opened State
  return (
    <>
      {/* 1. TOAST */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[110] flex items-center space-x-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg transition-all animate-in fade-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success'
            ? 'bg-card/90 border-success/45 text-text-primary shadow-success/5'
            : toast.type === 'error'
            ? 'bg-card/90 border-danger/45 text-text-primary shadow-danger/5'
            : 'bg-card/90 border-warning/45 text-text-primary shadow-warning/5'
        }`}>
          {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-success shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-danger shrink-0" />}
          {toast.type === 'info' && <InfoIcon className="h-5 w-5 text-warning shrink-0" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* 2. COMPOSE DIALOG */}
      {/* 
        On Mobile (<768px): fixed centered modal with backdrop grey blur
        On Desktop (>=768px): floating draggable popup at the bottom-right, NO backdrop background or blur (unless active/not minimized)
      */}
      <div
        ref={constraintsRef}
        className={`fixed inset-0 z-[100] ${
          isMinimized
            ? "pointer-events-none bg-transparent"
            : "md:pointer-events-none md:bg-transparent md:backdrop-blur-none bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 md:p-0"
        }`}
      >
        <motion.div
          layout
          drag={!isMinimized}
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={constraintsRef}
          dragElastic={0.05}
          dragMomentum={false}
          animate={isMinimized ? { x: 0, y: 0 } : undefined}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          style={
            window.innerWidth >= 768
              ? isMinimized
                ? {
                    position: 'fixed',
                    bottom: '0px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }
                : {
                    position: 'fixed',
                    bottom: '16px',
                    right: '16px',
                  }
              : undefined
          }
          className={`bg-card border border-border shadow-2xl text-text-primary flex flex-col overflow-hidden pointer-events-auto transition-colors duration-200 ${
            isMinimized
              ? "rounded-t-xl w-80 md:w-96 cursor-pointer hover:bg-hover-row"
              : "rounded-2xl w-full max-w-lg md:w-[500px]"
          }`}
          onClick={isMinimized ? restoreCompose : undefined}
        >
          {/* Header Bar */}
          <div
            onPointerDown={
              !isMinimized
                ? (e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('input') || target.closest('textarea')) return;
                    dragControls.start(e);
                  }
                : undefined
            }
            className={`px-6 border-b border-border flex items-center justify-between bg-surface-subtle select-none ${
              isMinimized ? 'h-12 rounded-t-xl cursor-pointer' : 'h-14 rounded-t-2xl md:cursor-move'
            }`}
          >
            <div className="flex-1 min-w-0" onClick={isMinimized ? restoreCompose : undefined}>
              <span className="font-bold text-text-primary text-sm truncate block">
                {isMinimized
                  ? (subject.trim() ? `Draft: ${subject}` : 'New Message')
                  : 'New Message'}
              </span>
            </div>
            
            <div className="flex items-center space-x-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={isMinimized ? restoreCompose : minimizeCompose}
                className="p-1 rounded-lg text-text-secondary hover:bg-sidebar-hover hover:text-text-primary transition-colors cursor-pointer flex items-center justify-center animate-zoom-in"
                title={isMinimized ? "Restore compose" : "Minimize compose"}
              >
                <Minus className={`h-4.5 w-4.5 transition-transform duration-200 ${isMinimized ? 'rotate-180' : ''}`} />
              </button>
              <button
                type="button"
                onClick={closeCompose}
                className="p-1 rounded-lg text-text-secondary hover:bg-sidebar-hover hover:text-text-primary transition-colors cursor-pointer flex items-center justify-center"
                title="Discard draft"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Form */}
          {!isMinimized && (
            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">To</label>
                <input
                  type="text"
                  placeholder="recipient@example.com"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-2 px-3.5 text-sm text-text-primary placeholder-slate-400 focus:outline-none focus:border-slate-500 shadow-sm transition-all animate-zoom-in"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Subject</label>
                <input
                  type="text"
                  placeholder="Subject Line"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-2 px-3.5 text-sm text-text-primary placeholder-slate-400 focus:outline-none focus:border-slate-500 shadow-sm transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Body</label>
                <textarea
                  rows={window.innerWidth >= 768 ? 8 : 5}
                  placeholder="Write your email body here..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-2 px-3.5 text-sm text-text-primary placeholder-slate-400 focus:outline-none focus:border-slate-500 shadow-sm transition-all resize-none"
                  required
                />
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
              />

              {/* Attachments Display List */}
              {attachments.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Attachments ({attachments.length})</span>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                    {attachments.map((file, idx) => (
                      <div
                        key={`file-${idx}`}
                        className="flex items-center space-x-1.5 bg-sidebar-hover text-text-primary px-3 py-1.5 rounded-lg border border-border text-xs font-semibold animate-zoom-in"
                      >
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <span className="text-text-muted text-[10px] font-normal">({(file.size / 1024).toFixed(1)} KB)</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="text-text-muted hover:text-danger p-0.5 rounded cursor-pointer transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Buttons Area */}
              <div className="flex items-center justify-between pt-2">
                {/* Attach File Button */}
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl border border-border text-xs font-bold text-text-secondary hover:bg-hover-row hover:text-text-primary transition-all cursor-pointer bg-card"
                >
                  <Paperclip className="h-4.5 w-4.5 text-slate-500" />
                  <span>Attach files</span>
                </button>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={savingDraft || sendingEmail}
                    className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-hover-row hover:text-text-primary transition-all cursor-pointer bg-card disabled:opacity-50"
                  >
                    {savingDraft ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    type="submit"
                    disabled={sendingEmail || savingDraft}
                    className="inline-flex items-center space-x-1.5 rounded-xl bg-success hover:opacity-90 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {sendingEmail ? (
                      <div className="flex items-center space-x-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-1.5 w-1.5 rounded-full bg-white animate-bounce"></div>
                        <span className="pl-1">Sending...</span>
                      </div>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </>
  );
}
