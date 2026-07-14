import modalState from "@/lib/store/modalState";
import { useState } from "react";
import toast from "react-hot-toast";

export default function AdminCourseReviewActionModal() {
  const modalInfo = modalState((state) => state.modalInfo);
  const action = String(modalInfo?.data?.action || "").toLowerCase();
  const courseTitle = String(modalInfo?.data?.courseTitle || "").trim();
  const onConfirm = modalInfo?.data?.onConfirm;
  const isRejectAction = action === "reject";

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
    if (isRejectAction && !trimmedNote) {
      toast.error("Rejection note is required.");
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

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="text-sm text-slate-600">
        {isRejectAction
          ? `Provide a rejection note for "${courseTitle}".`
          : `You are approving "${courseTitle}". You may add an optional note.`}
      </p>

      <textarea
        className="w-full min-h-28 rounded-lg border border-[#e2e8f0] p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        placeholder={
          isRejectAction ? "Reason for rejection..." : "Optional note..."
        }
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />

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
            isRejectAction ? "bg-red-400" : "bg-emerald-600"
          } ${isSubmitting ? "opacity-70" : ""}`}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Submitting..."
            : isRejectAction
              ? "Reject Course"
              : "Approve Course"}
        </button>
      </div>
    </form>
  );
}
