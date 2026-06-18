'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { io, type Socket } from 'socket.io-client';
import type { NewEmailSocketEvent } from '@/types/socket';

type UseEmailSocketOptions = {
  onNewEmail: (emailId: string) => void;
  enabled?: boolean;
};

export function useEmailSocket({ onNewEmail, enabled = true }: UseEmailSocketOptions) {
  const { getToken, isSignedIn } = useAuth();
  const onNewEmailRef = useRef(onNewEmail);
  onNewEmailRef.current = onNewEmail;

  useEffect(() => {
    if (!enabled || !isSignedIn) return;

    let socket: Socket | null = null;
    let cancelled = false;

    const connect = async () => {
      const token = await getToken();
      if (cancelled || !token) return;

      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || undefined;

      socket = io(socketUrl, {
        path: '/socket.io',
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
      });

      socket.on('connect', () => {
        console.log('📱 [Socket] Connected for real-time email updates');
      });

      socket.on('connected', (data: { message?: string }) => {
        console.log('📱 [Socket] Handshake verified:', data?.message ?? 'ready');
      });

      socket.on('new-email', (data: NewEmailSocketEvent) => {
        if (data?.emailId) {
          console.log('📱 [Socket] Received new-email event for ID:', data.emailId);
          onNewEmailRef.current(data.emailId);
        }
      });

      socket.on('email-summary-ready', (data: { emailId: string; summary: string }) => {
        if (data?.emailId && data?.summary) {
          console.log('📱 [Socket] Received email-summary-ready event for ID:', data.emailId);
          window.dispatchEvent(
            new CustomEvent('mailyflow-summary-ready', { detail: { emailId: data.emailId, summary: data.summary } })
          );
        }
      });

      socket.on('email-summary-failed', (data: { emailId: string; error: string }) => {
        if (data?.emailId) {
          console.log('📱 [Socket] Received email-summary-failed event for ID:', data.emailId);
          window.dispatchEvent(
            new CustomEvent('mailyflow-summary-failed', { detail: { emailId: data.emailId, error: data.error } })
          );
        }
      });

      socket.on('connect_error', async (err) => {
        console.warn('📱 [Socket] Connection error:', err.message);
        if (err.message === 'Unauthorized' && socket) {
          const freshToken = await getToken();
          if (freshToken) {
            socket.auth = { token: freshToken };
          }
        }
      });

      socket.io.on('reconnect_attempt', async () => {
        const freshToken = await getToken();
        if (freshToken && socket) {
          socket.auth = { token: freshToken };
        }
      });
    };

    connect();

    return () => {
      cancelled = true;
      if (socket) {
        console.log('📱 [Socket] Disconnecting');
        socket.disconnect();
      }
    };
  }, [enabled, getToken, isSignedIn]);
}
