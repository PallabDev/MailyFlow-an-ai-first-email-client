'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Inbox as InboxIcon,
  FileText,
  Send,
  AlertCircle,
  Clock,
  RefreshCw,
  PenSquare,
  ChevronLeft,
  Trash2,
  Check,
  Star
} from 'lucide-react';
import { parseSender, getInitials, getAvatarColor, formatEmailDate } from '@/utils/emailHelper';
import EmailDetail from './EmailDetail';
import ComposeModal from './ComposeModal';

type Email = {
  id: string;
  from: string;
  date: string;
  subject: string;
  snippet: string;
  body: string;
  labelIds?: string[];
  internalDate?: string;
};

type FolderPageClientProps = {
  initialEmails: Email[];
  initialNextPageToken: string | null;
  folder: 'inbox' | 'starred' | 'drafts' | 'sent' | 'spam' | 'trash';
  title: string;
  emailError: string | null;
};

// Mock fallback emails to display if there's no connection
const mockEmails: Email[] = [];

// SWR cache for folders to prevent layout flash during navigation
const emailCache: Record<string, {
  emails: Email[];
  nextPageToken: string | null;
  fetchedAt: number;
}> = {};

export default function FolderPageClient({
  initialEmails,
  initialNextPageToken,
  folder,
  title,
  emailError,
}: FolderPageClientProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  // Debounced search query state to prevent excessive API hits
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Keyboard navigation focus index and scroll handling
  const [focusedEmailIndex, setFocusedEmailIndex] = useState<number>(-1);
  const focusedEmailRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll focused row into viewport
  useEffect(() => {
    if (focusedEmailIndex >= 0 && focusedEmailRef.current) {
      focusedEmailRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [focusedEmailIndex]);

  // Reset focus index when folder or search query changes
  useEffect(() => {
    setFocusedEmailIndex(-1);
  }, [folder, debouncedSearch]);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const startLongPress = (emailId: string) => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      toggleSelectEmail(emailId);
      isLongPressRef.current = true;
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 600);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const toggleStarEmail = async (emailId: string) => {
    const email = emailsState.find((e) => e.id === emailId) || (selectedEmail?.id === emailId ? selectedEmail : null);
    if (!email) return;
    const isStarred = email.labelIds?.includes('STARRED') ?? false;

    // Optimistic UI update
    setEmailsState((prev) => {
      const updated = prev.map((e) => {
        if (e.id === emailId) {
          const currentLabels = e.labelIds || [];
          const nextLabels = isStarred
            ? currentLabels.filter((l) => l !== 'STARRED')
            : [...currentLabels, 'STARRED'];
          return { ...e, labelIds: nextLabels };
        }
        return e;
      });
      if (emailCache[folder]) {
        emailCache[folder].emails = updated;
      }
      return updated;
    });

    if (selectedEmail && selectedEmail.id === emailId) {
      setSelectedEmail((prev) => {
        if (!prev) return null;
        const currentLabels = prev.labelIds || [];
        const nextLabels = isStarred
          ? currentLabels.filter((l) => l !== 'STARRED')
          : [...currentLabels, 'STARRED'];
        return { ...prev, labelIds: nextLabels };
      });
    }

    try {
      await fetch('/api/star-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: emailId, starred: !isStarred }),
      });
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refresh-labels'));
      }, 100);
    } catch (err) {
      console.error('Error toggling star via API:', err);
    }
  };

  const [emailsState, setEmailsState] = useState<Email[]>(initialEmails);
  const [nextPageToken, setNextPageToken] = useState<string | null>(initialNextPageToken);
  const [loading, setLoading] = useState(initialEmails.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [emailErrorState, setEmailErrorState] = useState<string | null>(emailError);

  const fetchEmails = async (force: boolean = false, isBackground: boolean = false) => {
    if (force) {
      setRefreshing(true);
    } else if (!isBackground) {
      setLoading(true);
    }
    setEmailErrorState(null);
    try {
      const qParam = debouncedSearch ? `&q=${encodeURIComponent(debouncedSearch)}` : '';
      const res = await fetch(`/api/emails?folder=${folder}&limit=35${force ? '&refresh=true' : ''}${qParam}`);
      if (res.ok) {
        const data = await res.json();
        let fetchedEmails = data.emails ?? [];
        if (fetchedEmails.length === 0 && data.isDevFallback) {
          fetchedEmails = mockEmails;
        }
        
        // Cache the fetched emails
        emailCache[folder] = {
          emails: fetchedEmails,
          nextPageToken: data.nextPageToken || null,
          fetchedAt: Date.now()
        };

        setEmailsState(fetchedEmails);
        setNextPageToken(data.nextPageToken || null);
        window.dispatchEvent(new CustomEvent('refresh-labels'));
      } else {
        const data = await res.json().catch(() => ({}));
        setEmailErrorState(data.error || 'Failed to fetch emails.');
        if (!force && !isBackground) {
          setEmailsState(mockEmails);
        }
      }
    } catch (err) {
      console.error('Error fetching emails client-side:', err);
      setEmailErrorState('Failed to fetch emails.');
      if (!force && !isBackground) {
        setEmailsState(mockEmails);
      }
    } finally {
      if (force) {
        setRefreshing(false);
      } else if (!isBackground) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setSelectedEmail(null);
    setSelectedEmails(new Set()); // Reset selected on folder change
    
    if (debouncedSearch) {
      setNextPageToken(null);
      fetchEmails(false, false);
      return;
    }

    const cached = emailCache[folder];
    if (cached) {
      setEmailsState(cached.emails);
      setNextPageToken(cached.nextPageToken);
      setLoading(false);
      // Run DB revalidation in the background silently to get any updates
      fetchEmails(false, true);
    } else {
      setNextPageToken(null);
      // Fetch DB cache (this will fallback to Gmail API fetch if DB cache is empty)
      fetchEmails(false, false);
    }
  }, [folder, debouncedSearch]);

  // Connect to real-time new email events pushed from Corsair webhooks
  useEffect(() => {
    const eventSource = new EventSource('/api/emails/live', { withCredentials: true });

    eventSource.onopen = () => {
      console.log('📱 [SSE Client] Connection opened successfully');
    };

    eventSource.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📱 [SSE Client] Message received on SSE stream:', data);
        
        if (data && data.type === 'init') {
          console.log('📱 [SSE Client] Initial SSE handshake verified:', data.message);
          fetch('/api/debug/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `📱 [Client] SSE handshake received: "${data.message}"` })
          }).catch(() => {});
          return;
        }

        if (data && data.emailId) {
          const emailId = data.emailId;
          console.log('📱 [SSE Client] Received new-email event notification for ID:', emailId);
          
          fetch('/api/debug/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `📱 [Client] Received new-email event for ID: ${emailId}` })
          }).catch(() => {});
          
          let alreadyExists = false;
          setEmailsState((prev) => {
            alreadyExists = prev.some((e) => e.id === emailId);
            return prev;
          });
          if (alreadyExists) {
            console.log('📱 [SSE Client] Prepend skipped: Email ID already in list:', emailId);
            fetch('/api/debug/log', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: `📱 [Client] Email ID ${emailId} is already in the list. Skipping.` })
            }).catch(() => {});
            return;
          }

          console.log('📱 [SSE Client] Fetching email details from backend for ID:', emailId);
          // Load details of the newly arrived email
          const res = await fetch(`/api/emails/detail?id=${emailId}`);
          console.log('📱 [SSE Client] Fetch email details response status:', res.status);
          
          if (res.ok) {
            const newEmail = await res.json();
            console.log('📱 [SSE Client] Successfully fetched details for new email:', newEmail);
            
            // Only prepend if matching the current folder (e.g. inbox) and doesn't exist
            setEmailsState((prev) => {
              if (prev.some((e) => e.id === newEmail.id)) {
                console.log('📱 [SSE Client] Prepend skipped (race condition: already exists in state):', newEmail.id);
                return prev;
              }
              
              // Verify labelIds match the current folder filters
              if (folder === 'inbox' && newEmail.labelIds && !newEmail.labelIds.includes('INBOX')) {
                console.log('📱 [SSE Client] Prepend skipped: Email does not contain INBOX label. Labels:', newEmail.labelIds);
                fetch('/api/debug/log', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ message: `📱 [Client] New email ${newEmail.id} not in INBOX. Skipping prepend.` })
                }).catch(() => {});
                return prev;
              }
              if (folder === 'spam' && newEmail.labelIds && !newEmail.labelIds.includes('SPAM')) {
                console.log('📱 [SSE Client] Prepend skipped: Email does not contain SPAM label. Labels:', newEmail.labelIds);
                return prev;
              }
              if (folder === 'trash' && newEmail.labelIds && !newEmail.labelIds.includes('TRASH')) {
                console.log('📱 [SSE Client] Prepend skipped: Email does not contain TRASH label. Labels:', newEmail.labelIds);
                return prev;
              }
              
              console.log('📱 [SSE Client] Prepended new email successfully:', newEmail.id, `Subject: "${newEmail.subject}"`);
              fetch('/api/debug/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `📱 [Client] Prepended new email ID: ${newEmail.id} ("${newEmail.subject || '(no subject)'}") to folder: ${folder}` })
              }).catch(() => {});
              
              const updated = [newEmail, ...prev];
              // Update cache
              if (emailCache[folder]) {
                emailCache[folder].emails = updated;
              }
              return updated;
            });

            // Refresh sidebar counts dynamically
            window.dispatchEvent(new CustomEvent('refresh-labels'));
          } else {
            console.error('📱 [SSE Client] ❌ Failed to fetch details for email ID:', emailId);
            fetch('/api/debug/log', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: `📱 [Client] ❌ Failed to fetch details for email ID: ${emailId}. Status: ${res.status}` })
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error('📱 [SSE Client] ❌ Error handling notification:', err);
        fetch('/api/debug/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `📱 [Client] ❌ Error handling notification: ${err instanceof Error ? err.message : String(err)}` })
        }).catch(() => {});
      }
    };

    eventSource.onerror = (err) => {
      console.warn('📱 [SSE Client] ⚠️ SSE connection encountered an error:', err);
    };

    return () => {
      console.log('📱 [SSE Client] Closing SSE connection');
      eventSource.close();
    };
  }, [folder]);

  // Poll the database cache in the background every 30 seconds to ensure changes reflect even if SSE drops.
  // Visibility check is added to pause polling completely when the browser tab is hidden or minimized, saving DB egress.
  useEffect(() => {
    let active = true;

    const pollCache = async () => {
      if (document.hidden) {
        console.log('📱 [Cache Poller] Tab is in background, skipping background poll to save bandwidth.');
        return;
      }

      try {
        const qParam = debouncedSearch ? `&q=${encodeURIComponent(debouncedSearch)}` : '';
        const res = await fetch(`/api/emails?folder=${folder}&limit=35${qParam}`);
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          const fetchedEmails: Email[] = data.emails ?? [];
          if (fetchedEmails.length === 0 && data.isDevFallback) {
            return;
          }

          setEmailsState((prev) => {
            // Create a Map from the current emails for fast lookup and replacement
            const emailMap = new Map<string, Email>();
            
            // Add existing emails to the map
            prev.forEach(email => emailMap.set(email.id, email));
            
            let hasChanges = false;
            
            // Update or add fetched emails
            fetchedEmails.forEach((fetched) => {
              const existing = emailMap.get(fetched.id);
              if (!existing) {
                // New email found (e.g. synced via webhook, not yet in state)
                emailMap.set(fetched.id, fetched);
                hasChanges = true;
              } else {
                // Check if any fields changed (e.g. read/unread status in labelIds)
                const labelsChanged = JSON.stringify(existing.labelIds) !== JSON.stringify(fetched.labelIds);
                const otherFieldsChanged = existing.subject !== fetched.subject || 
                                           existing.from !== fetched.from || 
                                           existing.snippet !== fetched.snippet;
                if (labelsChanged || otherFieldsChanged) {
                  emailMap.set(fetched.id, { ...existing, ...fetched });
                  hasChanges = true;
                }
              }
            });

            if (hasChanges) {
              console.log('📱 [Cache Poller] 🔄 Cache changed! Updating email list from database cache.');
              const updated = Array.from(emailMap.values());
              // Update the in-memory cache
              if (emailCache[folder]) {
                emailCache[folder].emails = updated;
              }
              // Dispatch counts refresh
              window.dispatchEvent(new CustomEvent('refresh-labels'));
              return updated;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('📱 [Cache Poller] ❌ Error in background database cache poll:', err);
      }
    };

    const interval = setInterval(pollCache, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [folder, debouncedSearch]);

  const loadMoreEmails = async () => {
    if (loadingMore || !nextPageToken) return;
    setLoadingMore(true);
    try {
      const qParam = debouncedSearch ? `&q=${encodeURIComponent(debouncedSearch)}` : '';
      const res = await fetch(`/api/emails?pageToken=${encodeURIComponent(nextPageToken)}&limit=35&folder=${folder}${qParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data.emails && data.emails.length > 0) {
          setEmailsState((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const newEmails = data.emails.filter((e: Email) => !existingIds.has(e.id));
            const updated = [...prev, ...newEmails];
            if (emailCache[folder]) {
              emailCache[folder].emails = updated;
            }
            return updated;
          });
        }
        setNextPageToken(data.nextPageToken || null);
        if (emailCache[folder]) {
          emailCache[folder].nextPageToken = data.nextPageToken || null;
        }
      }
    } catch (error) {
      console.error('Error loading more emails:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (!nextPageToken || loadingMore) return;
    const target = e.currentTarget;
    const threshold = 150;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold;
    if (isNearBottom) {
      loadMoreEmails();
    }
  };

  const handleTrashEmail = async (emailId: string) => {
    // Optimistic UI update
    if (folder === 'trash') {
      setEmailsState((prev) => {
        const updated = prev.filter((e) => e.id !== emailId);
        if (emailCache[folder]) emailCache[folder].emails = updated;
        return updated;
      });
    } else {
      setEmailsState((prev) => {
        const updated = prev.map((e) => {
          if (e.id === emailId) {
            const nextLabels = (e.labelIds || []).filter((l) => l !== 'INBOX' && l !== 'DRAFT');
            if (!nextLabels.includes('TRASH')) nextLabels.push('TRASH');
            return { ...e, labelIds: nextLabels };
          }
          return e;
        });
        if (emailCache[folder]) emailCache[folder].emails = updated;
        return updated;
      });
    }
    setSelectedEmail(null);

    if (!emailId.startsWith('mock-')) {
      try {
        await fetch('/api/trash-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: emailId, permanently: folder === 'trash' }),
        });
      } catch (err) {
        console.error('Error calling trash API:', err);
      }
    }
  };

  const toggleSelectEmail = (emailId: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(emailId)) {
        next.delete(emailId);
      } else {
        next.add(emailId);
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedEmails);
    if (idsToDelete.length === 0) return;

    // Optimistically update local emails list
    setEmailsState((prev) => {
      const updated = prev.filter((e) => !selectedEmails.has(e.id));
      if (emailCache[folder]) emailCache[folder].emails = updated;
      return updated;
    });
    setSelectedEmails(new Set());
    setSelectedEmail(null);

    try {
      await Promise.all(
        idsToDelete.map(async (emailId) => {
          if (!emailId.startsWith('mock-')) {
            await fetch('/api/trash-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: emailId, permanently: folder === 'trash' }),
            });
          }
        })
      );
    } catch (error) {
      console.error('Error bulk deleting emails:', error);
    } finally {
      window.dispatchEvent(new CustomEvent('refresh-labels'));
    }
  };

  // Sort emails chronologically using internalDate or parsed Date header before filtering/displaying
  const getEmailTimestamp = (email: Email): number => {
    if (email.internalDate) {
      const parsed = parseInt(email.internalDate, 10);
      if (!isNaN(parsed)) return parsed;
    }
    const dateParsed = Date.parse(email.date);
    return isNaN(dateParsed) ? 0 : dateParsed;
  };

  const sortedEmails = [...emailsState].sort((a, b) => getEmailTimestamp(b) - getEmailTimestamp(a));

  // Filter based on query and folder
  const filteredEmails = sortedEmails.filter((email) => {
    const labels = email.labelIds || [];

    // If the email is trashed, it should only appear in the trash folder
    if (folder !== 'trash' && labels.includes('TRASH')) {
      return false;
    }
    // If the email is spam, it should only appear in the spam folder
    if (folder !== 'spam' && labels.includes('SPAM')) {
      return false;
    }

    if (folder === 'inbox') {
      if (!labels.includes('INBOX')) {
        // Fallback for mock emails if they don't have the INBOX label but we are in inbox
        if (!email.id.startsWith('mock-') || email.id.includes('draft') || email.id.includes('sent')) {
          return false;
        }
      }
    } else if (folder === 'drafts') {
      if (!labels.includes('DRAFT') && !email.id.includes('draft')) return false;
    } else if (folder === 'sent') {
      if (!labels.includes('SENT') && !email.id.includes('sent')) return false;
    } else if (folder === 'spam') {
      if (!labels.includes('SPAM') && !email.id.includes('spam')) return false;
    } else if (folder === 'trash') {
      if (!labels.includes('TRASH') && !email.id.includes('trash')) return false;
    }

    return true;
  });

  // Deduplicate emails by ID to avoid duplicate key console warnings and UI duplicate items
  const uniqueEmails: Email[] = [];
  const seenIds = new Set<string>();
  for (const email of filteredEmails) {
    if (!seenIds.has(email.id)) {
      seenIds.add(email.id);
      uniqueEmails.push(email);
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Only works on desktop mode, not mobile
      if (window.innerWidth < 768) return;

      // Check if user is typing in any input/textarea
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.getAttribute('contenteditable') === 'true'
      );
      if (isTyping) return;

      // Handle shortcuts
      switch (e.key) {
        case 'c':
        case 'C': {
          e.preventDefault();
          setIsComposeOpen(true);
          break;
        }
        case 'Escape': {
          if (selectedEmail) {
            e.preventDefault();
            setSelectedEmail(null);
          }
          break;
        }
        case 'u':
        case 'U': {
          if (selectedEmail) {
            e.preventDefault();
            setSelectedEmail(null);
          }
          break;
        }
        case 'j':
        case 'J': {
          e.preventDefault();
          if (selectedEmail) {
            // Detail view: open next email
            const currentIndex = uniqueEmails.findIndex(m => m.id === selectedEmail.id);
            if (currentIndex !== -1 && currentIndex < uniqueEmails.length - 1) {
              setSelectedEmail(uniqueEmails[currentIndex + 1]);
            }
          } else {
            // List view: navigate focus index down
            setFocusedEmailIndex(prev => {
              const next = prev + 1;
              return next < uniqueEmails.length ? next : prev;
            });
          }
          break;
        }
        case 'k':
        case 'K': {
          e.preventDefault();
          if (selectedEmail) {
            // Detail view: open previous email
            const currentIndex = uniqueEmails.findIndex(m => m.id === selectedEmail.id);
            if (currentIndex > 0) {
              setSelectedEmail(uniqueEmails[currentIndex - 1]);
            }
          } else {
            // List view: navigate focus index up
            setFocusedEmailIndex(prev => {
              const next = prev - 1;
              return next >= 0 ? next : prev;
            });
          }
          break;
        }
        case 'Enter':
        case 'o':
        case 'O': {
          if (!selectedEmail && focusedEmailIndex >= 0 && focusedEmailIndex < uniqueEmails.length) {
            e.preventDefault();
            setSelectedEmail(uniqueEmails[focusedEmailIndex]);
          }
          break;
        }
        case 'r':
        case 'R': {
          if (selectedEmail) {
            e.preventDefault();
            // Focus reply textarea inside EmailDetail
            const replyTextArea = document.querySelector('textarea[placeholder="Type your reply here..."]') as HTMLTextAreaElement;
            replyTextArea?.focus();
          }
          break;
        }
        case 's':
        case 'S': {
          const activeId = selectedEmail?.id || (focusedEmailIndex >= 0 && uniqueEmails[focusedEmailIndex]?.id);
          if (activeId) {
            e.preventDefault();
            toggleStarEmail(activeId);
          }
          break;
        }
        case 'e':
        case 'E':
        case '#':
        case 'd':
        case 'D': {
          const activeId = selectedEmail?.id || (focusedEmailIndex >= 0 && uniqueEmails[focusedEmailIndex]?.id);
          if (activeId) {
            e.preventDefault();
            handleTrashEmail(activeId);
          }
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedEmail, focusedEmailIndex, uniqueEmails]);



  const getFolderIcon = () => {
    const unreadCount = uniqueEmails.filter(e => e.labelIds?.includes('UNREAD')).length;

    switch (folder) {
      case 'inbox': 
        return (
          <div className="relative flex items-center shrink-0">
            <InboxIcon className="h-5 w-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-success text-white text-[9px] font-bold px-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center border border-card shadow-sm">
                {unreadCount}
              </span>
            )}
          </div>
        );
      case 'starred':
        return <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 shrink-0" />;
      case 'drafts': return <FileText className="h-5 w-5 text-slate-600 shrink-0" />;
      case 'sent': return <Send className="h-5 w-5 text-slate-600 shrink-0" />;
      case 'spam': return <AlertCircle className="h-5 w-5 text-slate-600 shrink-0" />;
      case 'trash': return <Clock className="h-5 w-5 text-slate-600 shrink-0" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background text-text-primary">
      {/* Tab Content Header */}
      <div className="h-16 px-6 border-b border-border flex items-center justify-between shrink-0 bg-card">
        {selectedEmail ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedEmail(null)}
                className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-lg text-sm font-semibold text-text-secondary hover:bg-sidebar-hover hover:text-text-primary transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {folder !== 'sent' && (
                <button
                  onClick={() => toggleStarEmail(selectedEmail.id)}
                  className="p-2 text-text-secondary hover:text-yellow-500 hover:bg-yellow-500/10 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                  title={selectedEmail.labelIds?.includes('STARRED') ? "Unstar Email" : "Star Email"}
                >
                  <Star className={`h-4.5 w-4.5 ${selectedEmail.labelIds?.includes('STARRED') ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400'}`} />
                </button>
              )}
              <button
                onClick={() => handleTrashEmail(selectedEmail.id)}
                className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                title={folder === 'trash' ? "Delete Permanently" : "Move to Trash"}
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        ) : selectedEmails.size > 0 ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedEmails(new Set())}
                className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-sidebar-hover rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0"
                title="Cancel selection"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              <span className="text-sm font-bold text-text-primary">
                {selectedEmails.size} selected
              </span>
            </div>
            <button
              onClick={handleBulkDelete}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
              title="Delete selected"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              {getFolderIcon()}
              <h1 className="text-lg font-bold text-text-primary">{title}</h1>

              {/* Refresh Button */}
              <button
                onClick={() => fetchEmails(true)}
                disabled={loading || refreshing}
                className={`p-1.5 text-text-secondary hover:text-text-primary hover:bg-sidebar-hover rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
                  (loading || refreshing) ? 'animate-spin opacity-50' : ''
                }`}
                title="Refresh messages"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              {folder !== 'inbox' && (
                <span className="text-xs text-text-secondary font-medium">
                  {`${uniqueEmails.length} messages`}
                </span>
              )}
            </div>

            {folder !== 'trash' && (
              <button
                onClick={() => setIsComposeOpen(true)}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <PenSquare className="h-4 w-4" />
                <span>Compose</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Message Reader / List View */}
      {selectedEmail ? (
        <EmailDetail
          email={selectedEmail}
          onBack={() => setSelectedEmail(null)}
          onTrash={handleTrashEmail}
          onStar={toggleStarEmail}
        />
      ) : (
        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-background"
        >
          <div className="divide-y divide-border-row">
            {emailErrorState && (
              <div className="m-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-700">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
                  <div className="text-sm space-y-1">
                    <span className="font-bold block text-red-800">Gmail Connection Error</span>
                    <p className="text-red-700 font-medium">{emailErrorState}</p>
                    <p className="text-xs text-red-600/80">Your Gmail connection needs to be re-authorized to sync messages.</p>
                  </div>
                </div>
                <a
                  href="/api/auth/connect?plugin=gmail"
                  className="shrink-0 inline-flex items-center space-x-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer decoration-none"
                >
                  <span>Reconnect Gmail</span>
                </a>
              </div>
            )}

            {loading ? (
              <div className="divide-y divide-border-row">
                {[...Array(6)].map((_, i) => (
                  <div key={`skeleton-${i}`} className="flex items-center px-6 py-4 animate-pulse relative">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      {/* Checkbox Skeleton (Desktop only) */}
                      <div className="hidden md:block h-4 w-4 bg-surface-subtle rounded shrink-0"></div>

                      {/* Star Skeleton (Desktop only) */}
                      {folder !== 'sent' && (
                        <div className="hidden md:block h-4.5 w-4.5 bg-surface-subtle rounded shrink-0"></div>
                      )}

                      {/* Avatar Skeleton (Mobile only) */}
                      <div className="md:hidden block h-10 w-10 shrink-0 rounded-full bg-surface-subtle"></div>

                      {/* Mobile skeleton: two lines */}
                      <div className="flex-1 min-w-0 md:hidden block">
                        <div className="flex items-baseline justify-between">
                          {/* Name Skeleton */}
                          <div className="h-4 w-28 bg-surface-subtle rounded"></div>
                          {/* Date Skeleton */}
                          <div className="h-3 w-14 bg-border rounded"></div>
                        </div>
                        {/* Subject & Snippet Skeleton */}
                        <div className="h-3 w-5/6 bg-border rounded mt-2"></div>
                      </div>

                      {/* Desktop skeleton: single line */}
                      <div className="hidden md:flex items-center flex-1 min-w-0 space-x-4">
                        {/* Name Skeleton */}
                        <div className="h-4 w-48 bg-surface-subtle rounded shrink-0"></div>
                        {/* Subject & Snippet Skeleton */}
                        <div className="h-3 bg-border rounded flex-1 min-w-0"></div>
                        {/* Date Skeleton */}
                        <div className="h-3 w-14 bg-border rounded shrink-0"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {!emailErrorState && uniqueEmails.length === 0 && !nextPageToken && !loading && (
                  <div className="flex flex-col items-center justify-center p-20 text-center">
                    <InboxIcon className="h-12 w-12 text-text-muted mb-3" />
                    <span className="font-semibold text-text-secondary">All caught up!</span>
                    <p className="text-xs text-text-muted mt-1 max-w-sm">
                      No emails match your active filters.
                    </p>
                  </div>
                )}
              </>
            )}

            {!loading && uniqueEmails.map((email, idx) => {
              const sender = parseSender(email.from);
              const isSelected = selectedEmails.has(email.id);
              const isUnread = email.labelIds ? email.labelIds.includes('UNREAD') : idx < 3;
              const isFocused = focusedEmailIndex === idx;

              return (
                <div
                  key={`${email.id}-${idx}`}
                  ref={isFocused ? focusedEmailRef : null}
                  onMouseDown={() => startLongPress(email.id)}
                  onMouseUp={cancelLongPress}
                  onTouchStart={() => startLongPress(email.id)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  onClick={() => {
                    if (isLongPressRef.current) {
                      isLongPressRef.current = false;
                      return;
                    }

                    if (selectedEmails.size > 0) {
                      toggleSelectEmail(email.id);
                    } else {
                      setSelectedEmail(email);
                      if (isUnread) {
                        setEmailsState((prev) => {
                          const updated = prev.map((e) => {
                            if (e.id === email.id) {
                              const currentLabels = e.labelIds || [];
                              return {
                                ...e,
                                labelIds: currentLabels.filter((l) => l !== 'UNREAD'),
                              };
                            }
                            return e;
                          });
                          if (emailCache[folder]) {
                            emailCache[folder].emails = updated;
                          }
                          return updated;
                        });
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('refresh-labels'));
                        }, 100);
                      }
                    }
                  }}
                  className={`group flex items-center px-6 py-4 transition-colors hover:bg-hover-row cursor-pointer relative ${
                    isUnread ? 'bg-mail-unread-bg' : 'bg-mail-read-bg'
                  } ${isSelected ? 'bg-blue-500/10 dark:bg-blue-400/10' : ''} ${
                    isFocused ? 'ring-2 ring-inset ring-success/30 bg-hover-row border-l-4 border-success' : 'border-l-4 border-transparent'
                  }`}
                >


                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Checkbox (Desktop only, always visible) */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectEmail(email.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4.5 w-4.5 rounded-md border-2 border-border text-success focus:ring-success accent-success bg-background cursor-pointer hidden md:block shrink-0"
                    />

                    {/* Star Button (Desktop only) */}
                    {folder !== 'sent' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStarEmail(email.id);
                        }}
                        className="p-1 hover:bg-hover-row rounded transition-colors text-text-muted hover:text-yellow-500 cursor-pointer hidden md:block shrink-0"
                      >
                        <Star className={`h-4.5 w-4.5 ${email.labelIds?.includes('STARRED') ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400'}`} />
                      </button>
                    )}

                    {/* Avatar (Mobile only, hidden on desktop) */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectEmail(email.id);
                      }}
                      className="relative shrink-0 cursor-pointer md:hidden block"
                    >
                      {isSelected ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          className="h-10 w-10 rounded-full bg-success flex items-center justify-center text-white"
                        >
                          <Check className="h-5.5 w-5.5" />
                        </motion.div>
                      ) : (
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${getAvatarColor(sender.name)}`}>
                          {getInitials(email.from)}
                        </div>
                      )}
                    </div>

                    {/* Mobile layout: two lines */}
                    <div className="flex-1 min-w-0 md:hidden block">
                      <div className="flex items-baseline justify-between">
                        <span className={`text-sm leading-tight ${isUnread ? 'font-bold text-text-primary' : 'font-normal text-text-secondary'}`}>
                          {sender.name}
                        </span>
                        <span className={`text-xs shrink-0 ${isUnread ? 'font-semibold text-text-primary' : 'font-medium text-text-muted'}`}>
                          {formatEmailDate(email.date)}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary truncate leading-relaxed mt-1">
                        <span className={`pr-1 ${isUnread ? 'font-semibold text-text-primary' : 'font-normal text-text-secondary'}`}>
                          {email.subject}
                        </span>
                        <span className="text-text-muted font-normal">— {email.snippet}</span>
                      </p>
                    </div>

                    {/* Desktop layout: single line */}
                    <div className="hidden md:flex items-center flex-1 min-w-0 space-x-4">
                      {/* Sender */}
                      <span className={`text-sm truncate w-48 shrink-0 ${isUnread ? 'font-bold text-text-primary' : 'font-normal text-text-secondary'}`}>
                        {sender.name}
                      </span>
                      
                      {/* Subject & Snippet */}
                      <p className="text-sm text-text-secondary truncate flex-1 min-w-0">
                        <span className={`pr-1 ${isUnread ? 'font-semibold text-text-primary' : 'font-normal text-text-secondary'}`}>
                          {email.subject}
                        </span>
                        <span className="text-text-muted font-normal">— {email.snippet}</span>
                      </p>
                      
                      {/* Time */}
                      <span className={`text-xs shrink-0 pl-4 ${isUnread ? 'font-semibold text-text-primary' : 'font-medium text-text-muted'}`}>
                        {formatEmailDate(email.date)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {loadingMore && (
              <div className="flex items-center justify-center p-6 space-x-2.5 bg-surface-subtle">
                <RefreshCw className="h-4.5 w-4.5 animate-spin text-text-secondary" />
                <span className="text-xs text-text-secondary font-semibold">Loading more messages...</span>
              </div>
            )}

            {!nextPageToken && filteredEmails.length > 0 && (
              <div className="text-center py-6 text-xs text-text-muted font-semibold bg-surface-subtle/50">
                ✨ End of your inbox list
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compose modal */}
      <ComposeModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} />
    </div>
  );
}
