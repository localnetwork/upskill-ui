import modalState from "@/lib/store/modalState";
import { useState } from "react";
import toast from "react-hot-toast";

const SUSPENSION_SUGGESTIONS = [
  "Copyright or intellectual property violation",
  "Inappropriate or offensive content",
  "Misleading title, description or claims",
  "Violates platform content policy",
  "Outdated or inaccurate content",
  "Multiple learner complaints under investigation",
];

export default function AdminCourseReviewActionModal() {
  const modalInfo = modalState((state) => state.modalInfo);
  const action = String(modalInfo?.data?.action || "").toLowerCase();
  const courseTitle = String(modalInfo?.data?.courseTitle || "").trim();
  const onConfirm = modalInfo?.data?.onConfirm;
  const isSuspendAction = action === "suspend";
  const isReinstateAction = action === "reinstate";
  const isDismissAction = action === "dismiss";
  const isRejectAction = action === "reject";
  const requiresNote = isRejectAction || isSuspendAction;
  const isDestructive = isRejectAction || isSuspendAction;

  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeModal = () => {
    modalState.setState({ modalInfo: null });
    document.body.style.overflow = "auto";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedNote = String(note || "").trim();
    if (requiresNote && !trimmedNote) {
      toast.error(isSuspendAction ? "Suspension reason is required." : "Rejection note is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (typeof onConfirm === "function") {
        await onConfirm(trimmedNote || undefined);
      }
      closeModal();
    } catch (_error) {
      // Error toast is handled by the caller to keep endpoint messaging consistent.
    } finally {
      setIsSubmitting(false);
    }
  };

  const description = isSuspendAction
    ? `Suspend "${courseTitle}". It will be hidden from the public immediately. Enrolled learners keep access and will see a suspension notice.`
    : isDismissAction
      ? `Dismiss the report on "${courseTitle}". No action will be taken on the course. You may add an optional note.`
      : isReinstateAction
      ? `Reinstate "${courseTitle}". It will be visible to the public again. You may add an optional note.`
      : isRejectAction
        ? `Provide a rejection note for "${courseTitle}".`
        : `You are approving "${courseTitle}". You may add an optional note.`;

  const placeholder = isSuspendAction
    ? "Reason for suspension..."
    : isRejectAction
      ? "Reason for rejection..."
      : "Optional note...";

  const submitLabel = isSuspendAction
    ? "Suspend Course"
    : isDismissAction
      ? "Dismiss Report"
      : isReinstateAction
      ? "Reinstate Course"
      : isRejectAction
        ? "Reject Course"
        : "Approve Course";

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="text-sm text-slate-600">{description}</p>

      <textarea
        className="w-full min-h-28 rounded-lg border border-[#e2e8f0] p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        placeholder={placeholder}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />

      {isSuspendAction && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Suggested reasons
          </p>
          <div className="flex flex-wrap gap-2">
            {SUSPENSION_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setNote(suggestion)}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                  note === suggestion
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-[#e2e8f0] text-slate-600 hover:bg-slate-50"
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={closeModal}
          className="px-4 py-2 rounded-md border border-[#e2e8f0] text-sm font-semibold"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`px-4 py-2 rounded-md text-sm font-semibold text-white ${
            isDestructive ? "bg-red-400" : "bg-emerald-600"
          } ${isSubmitting ? "opacity-70" : ""}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
