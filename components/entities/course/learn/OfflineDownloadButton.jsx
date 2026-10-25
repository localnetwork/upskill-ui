import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Loader2, Trash2 } from "lucide-react";
import {
  autoDownloadLesson,
  cacheLearnPage,
  getDownload,
  getDownloadableMediaUrl,
  isOfflineSupported,
  onDownloadsChange,
  removeDownload,
} from "@/lib/offline/downloads";

// Downloads the lesson automatically; the button only offers removal.
export default function OfflineDownloadButton({ lecture, course }) {
  const [downloaded, setDownloaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const lessonId = lecture?.id;
  const slug = course?.slug;

  const isVideo = lecture?.curriculum_resource_type === "video";
  const eligible =
    Boolean(lessonId) &&
    !lecture?.is_locked &&
    isOfflineSupported() &&
    (!isVideo || Boolean(getDownloadableMediaUrl(lecture)));

  useEffect(() => {
    if (!lessonId || !isOfflineSupported()) return undefined;
    const load = () =>
      getDownload(lessonId)
        .then((entry) => setDownloaded(Boolean(entry)))
        .catch(() => {});
    load();
    return onDownloadsChange(load);
  }, [lessonId]);

  useEffect(() => {
    if (slug) cacheLearnPage(slug);
  }, [slug]);

  useEffect(() => {
    if (!eligible) return;
    let cancelled = false;
    setBusy(true);
    autoDownloadLesson({ lecture, course })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, eligible]);

  if (!eligible) return null;

  const handleRemove = async () => {
    try {
      await removeDownload(lessonId);
      toast.success("Removed from offline");
    } catch (error) {
      toast.error(error?.message || "Could not remove offline copy");
    }
  };

  if (busy) {
    return (
      <p className="mt-4 inline-flex items-center gap-2 text-sm text-primary/70">
        <Loader2 size={16} className="animate-spin" />
        Saving for offline...
      </p>
    );
  }

  if (!downloaded) return null;

  return (
    <button
      type="button"
      onClick={handleRemove}
      className="mt-4 inline-flex items-center gap-2 rounded-md border border-primary/30 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/10"
    >
      <CheckCircle2 size={14} className="text-green-600" />
      Available offline
      <Trash2 size={14} />
      <span className="sr-only">Remove offline copy</span>
    </button>
  );
}
