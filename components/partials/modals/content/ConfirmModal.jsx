import modalState from "@/lib/store/modalState";
import { settleConfirm } from "@/lib/services/confirm";

export default function ConfirmModal() {
  const data = modalState((state) => state.modalInfo?.data) || {};
  const isDanger = data.variant === "danger";

  const finish = (result) => {
    settleConfirm(result);
    modalState.setState({ modalInfo: null });
    document.body.style.overflow = "auto";
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">{data.message}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => finish(false)}
          className="px-4 py-2 rounded-md border border-[#e2e8f0] text-sm font-semibold"
        >
          {data.cancelText || "Cancel"}
        </button>
        <button
          type="button"
          autoFocus
          onClick={() => finish(true)}
          className={`px-4 py-2 rounded-md text-sm font-semibold text-white ${
            isDanger ? "bg-red-600 hover:bg-red-700" : "bg-[#0056D2] hover:bg-[#1d6de0]"
          }`}
        >
          {data.confirmText || "Confirm"}
        </button>
      </div>
    </div>
  );
}
