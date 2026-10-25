import modalState from "@/lib/store/modalState";

let pendingResolve = null;

export function settleConfirm(result) {
  const resolve = pendingResolve;
  pendingResolve = null;
  resolve?.(result);
}

/**
 * Promise-based replacement for window.confirm that renders through the shared Modal.
 * Resolves true on confirm; false on cancel, close, or when superseded by another confirm.
 */
export function confirmModal({
  title = "Please confirm",
  message = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
} = {}) {
  settleConfirm(false);
  return new Promise((resolve) => {
    pendingResolve = resolve;
    modalState.setState({
      modalInfo: {
        type: "CONFIRM",
        title,
        size: "sm",
        data: { message, confirmText, cancelText, variant },
      },
    });
  });
}
