import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { mutate as swrMutate } from "swr";
import toast from "react-hot-toast";
import { WifiOff, RefreshCw } from "lucide-react";
import {
  flushQueue,
  getPendingCount,
  onQueueChange,
} from "@/lib/offline/queue";
import { warmLinkedPages } from "@/lib/offline/warmPages";

const swEnabled =
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_ENABLE_SW === "true";

export default function OfflineProvider() {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if (swEnabled && "serviceWorker" in navigator) {
      const api = encodeURIComponent(process.env.NEXT_PUBLIC_API_URL || "");
      navigator.serviceWorker
        .register(`/sw.js?api=${api}`, { scope: "/" })
        .catch((error) => console.error("Service worker failed", error));
    }
  }, []);

  // After each navigation, quietly store the pages it links to.
  useEffect(() => {
    if (!swEnabled) return undefined;
    const run = () => warmLinkedPages();
    const timer = setTimeout(
      () =>
        "requestIdleCallback" in window
          ? window.requestIdleCallback(run, { timeout: 5000 })
          : run(),
      2500,
    );
    return () => clearTimeout(timer);
  }, [router.asPath]);

  useEffect(() => {
    const refreshPending = () => getPendingCount().then(setPending);
    const sync = async () => {
      const synced = await flushQueue();
      if (synced > 0) {
        toast.success(`Synced ${synced} offline update(s)`);
        swrMutate(() => true);
        router.replace(window.location.pathname + window.location.search);
      }
    };
    const handleOnline = () => {
      setOnline(true);
      sync();
    };
    const handleOffline = () => setOnline(false);

    setOnline(navigator.onLine);
    refreshPending();
    if (navigator.onLine) sync();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    const unsubscribe = onQueueChange(refreshPending);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
    };
  }, []);

  if (online && pending === 0) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 rounded-full bg-[#16161D] px-4 py-2 text-sm text-white shadow-lg"
    >
      {online ? <RefreshCw size={16} /> : <WifiOff size={16} />}
      {online
        ? `Syncing ${pending} offline update(s)...`
        : `You're offline${pending ? ` · ${pending} update(s) waiting to sync` : ""}`}
    </div>
  );
}
