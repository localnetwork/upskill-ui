import modalState from "@/lib/store/modalState";
import { useEffect, useState } from "react";

export default function InstructorDraftCourseDeleteModal() {
  const modalInfo = modalState((state) => state.modalInfo);
  const courseTitle = String(modalInfo?.data?.courseTitle || "this draft course").trim();
  const onConfirm = modalInfo?.data?.onConfirm;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  useEffect(() => {
    setConfirmationText("");
  }, [courseTitle]);

  const closeModal = () => {
    modalState.setState({ modalInfo: null });
    document.body.style.overflow = "auto";
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;
    if (confirmationText.trim() !== courseTitle) return;

    try {
      setIsSubmitting(true);
      if (typeof onConfirm === "function") {
        await onConfirm();
      }
      closeModal();
    } catch (_error) {
      // Error toast is handled by the caller.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Are you sure you want to delete <span className="font-semibold">"{courseTitle}"</span>? This action cannot
        be undone.
      </p>

      <div className="space-y-2">
        <label htmlFor="course-delete-confirmation" className="text-sm text-slate-700">
          Type <span className="font-semibold">"{courseTitle}"</span> to confirm.
        </label>
        <input
          id="course-delete-confirmation"
          type="text"
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-[#e2e8f0] text-sm"
          placeholder={courseTitle}
          autoComplete="off"
        />
      </div>

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
          type="button"
          onClick={handleConfirm}
          className={`px-4 py-2 rounded-md text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 ${
            isSubmitting || confirmationText.trim() !== courseTitle ? "opacity-70" : ""
          }`}
          disabled={isSubmitting || confirmationText.trim() !== courseTitle}
        >
          {isSubmitting ? "Deleting..." : "Delete Draft"}
        </button>
      </div>
    </div>
  );
}
