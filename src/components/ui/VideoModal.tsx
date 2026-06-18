"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, AlertCircle } from "lucide-react";

const VIDEO_URL = "https://mailyflow-demo.pallabdev.in";

export default function VideoModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) {
      setLoading(true);
      setError(false);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const onBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="video-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onBackdropClick}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            key="video-modal-content"
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-4xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close video"
              className="absolute -top-12 right-0 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>

            {/* Video container */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_40px_120px_rgba(0,0,0,0.7)]">
              <div className="relative aspect-video">
                {loading && !error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900">
                    <Loader2 size={28} className="animate-spin text-white/50" />
                    <span className="text-sm text-white/40">Loading video…</span>
                  </div>
                )}

                {error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900">
                    <AlertCircle size={28} className="text-red-400/70" />
                    <span className="text-sm text-white/40">
                      Unable to load video.
                    </span>
                    <a
                      href={VIDEO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      Open in new tab
                    </a>
                  </div>
                )}

                <video
                  ref={videoRef}
                  className="h-full w-full object-contain"
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                  onCanPlay={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError(true);
                  }}
                >
                  <source src={VIDEO_URL} type="video/mp4" />
                </video>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
