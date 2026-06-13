import modalState from "@/lib/store/modalState";
import toast from "react-hot-toast";
import {
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  TelegramIcon,
  TelegramShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";

export default function ShareSocial() {
  const modalInfo = modalState((state) => state.modalInfo);
  const shareUrl =
    modalInfo?.data?.url ||
    (typeof window !== "undefined" ? window.location.href : "");
  const shareTitle =
    modalInfo?.data?.title || "Check out my Upskill certificate";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Certification URL copied.");
    } catch (_error) {
      toast.error("Failed to copy certification URL.");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Share your achievement on social media.
      </p>

      <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 gap-4">
        <LinkedinShareButton url={shareUrl} title={shareTitle}>
          <div className="flex flex-col items-center gap-2">
            <LinkedinIcon size={48} round />
            <span className="text-xs font-semibold text-slate-700">
              LinkedIn
            </span>
          </div>
        </LinkedinShareButton>

        <FacebookShareButton url={shareUrl} hashtag="#Upskill">
          <div className="flex flex-col items-center gap-2">
            <FacebookIcon size={48} round />
            <span className="text-xs font-semibold text-slate-700">
              Facebook
            </span>
          </div>
        </FacebookShareButton>

        <TwitterShareButton url={shareUrl} title={shareTitle}>
          <div className="flex flex-col items-center gap-2">
            <TwitterIcon size={48} round />
            <span className="text-xs font-semibold text-slate-700">X</span>
          </div>
        </TwitterShareButton>

        <WhatsappShareButton url={shareUrl} title={shareTitle}>
          <div className="flex flex-col items-center gap-2">
            <WhatsappIcon size={48} round />
            <span className="text-xs font-semibold text-slate-700">
              WhatsApp
            </span>
          </div>
        </WhatsappShareButton>

        <TelegramShareButton url={shareUrl} title={shareTitle}>
          <div className="flex flex-col items-center gap-2">
            <TelegramIcon size={48} round />
            <span className="text-xs font-semibold text-slate-700">
              Telegram
            </span>
          </div>
        </TelegramShareButton>
      </div>

      <button
        onClick={handleCopy}
        className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
      >
        Copy Certification URL
      </button>
    </div>
  );
}
