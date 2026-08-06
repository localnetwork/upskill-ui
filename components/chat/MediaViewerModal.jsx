import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

function formatName(user) {
  return (
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    user?.email ||
    "User"
  );
}

function formatTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch (_error) {
    return "";
  }
}

export default function MediaViewerModal({
  items = [],
  index = 0,
  onClose,
  profile,
}) {
  const [currentIndex, setCurrentIndex] = useState(() =>
    items.length
      ? Math.max(0, Math.min(Number(index) || 0, items.length - 1))
      : 0,
  );

  const goPrev = useCallback(() => {
    if (!items.length) return;
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const goNext = useCallback(() => {
    if (!items.length) return;
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      } else if (event.key === "ArrowLeft") {
        goPrev();
      } else if (event.key === "ArrowRight") {
        goNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, onClose]);

  const current = items[currentIndex] || null;
  const currentId = current?.id || null;

  // If the currently viewed item disappears (e.g. deleted), close the modal.
  useEffect(() => {
    if (!items.length) {
      onClose?.();
      return;
    }
    if (currentId && !items.some((item) => item.id === currentId)) {
      onClose?.();
    }
  }, [currentId, items, onClose]);

  const headerName = current
    ? current.sender?.id && current.sender.id === profile?.id
      ? "You"
      : formatName(current.sender)
    : "Media";

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[85vh] max-w-[90vw] flex-col items-center"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-3 flex w-full items-center justify-between gap-4">
          <div className="min-w-0 text-left">
            <p className="truncate text-base font-semibold text-white">
              {headerName}
            </p>
            <p className="text-xs text-slate-300">
              {current ? formatTime(current.createdAt) : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close media viewer"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Media */}
        <div className="flex min-h-0 items-center justify-center">
          {current ? (
            current.mediaType === "VIDEO" ? (
              <video
                src={current.mediaPath}
                controls
                className="max-h-[70vh] max-w-[90vw] rounded-xl bg-black"
              />
            ) : (
              <img
                src={current.mediaPath}
                alt="Media attachment"
                className="max-h-[70vh] max-w-[90vw] rounded-xl object-contain"
              />
            )
          ) : (
            <p className="text-sm text-slate-400">Media unavailable</p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 text-center">
          <p className="text-sm text-slate-300">
            {items.length ? `${currentIndex + 1} / ${items.length}` : "0 / 0"}
          </p>
        </div>

        {/* Prev / Next */}
        {items.length > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous media"
              className="absolute left-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/25"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next media"
              className="absolute right-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/25"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
