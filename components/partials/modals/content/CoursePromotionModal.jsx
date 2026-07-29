import modalState from "@/lib/store/modalState";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Check, RefreshCw, X } from "lucide-react";

const COUPON_TYPES = {
  CURRENT_BEST_PRICE: "CURRENT_BEST_PRICE",
  CUSTOM_PRICE: "CUSTOM_PRICE",
  FREE_OPEN: "FREE_OPEN",
  FREE_TARGETED: "FREE_TARGETED",
};

const TYPE_META = {
  [COUPON_TYPES.CURRENT_BEST_PRICE]: {
    label: "Current best price",
    expiresInDays: 5,
    maxRedemptions: null,
  },
  [COUPON_TYPES.CUSTOM_PRICE]: {
    label: "Custom price",
    expiresInDays: 31,
    maxRedemptions: null,
  },
  [COUPON_TYPES.FREE_OPEN]: {
    label: "Free: Open",
    expiresInDays: 5,
    maxRedemptions: 10,
  },
  [COUPON_TYPES.FREE_TARGETED]: {
    label: "Free: Targeted",
    expiresInDays: 31,
    maxRedemptions: 100,
  },
};

function toSafeNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toCurrency(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toSafeNumber(value));
}

function getCurrentBestPrice(basePrice) {
  const safeBase = Math.max(0, toSafeNumber(basePrice));
  if (safeBase <= 0) return 0;
  return Number(Math.max(1, (safeBase * 0.5).toFixed(2)));
}

function generateCouponCode() {
  return `UPSKILL${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function addDaysIso(days) {
  const date = new Date();
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().slice(0, 16);
}

export default function CoursePromotionModal() {
  const modalInfo = modalState((state) => state.modalInfo);
  const basePrice = Math.max(0, toSafeNumber(modalInfo?.data?.basePrice || 0));
  const onSave = modalInfo?.data?.onSave;
  const existingCodes = Array.isArray(modalInfo?.data?.existingCodes)
    ? modalInfo.data.existingCodes
    : [];

  const [selectedType, setSelectedType] = useState(COUPON_TYPES.CURRENT_BEST_PRICE);
  const [step, setStep] = useState(1);
  const [customPrice, setCustomPrice] = useState("");
  const [code, setCode] = useState(generateCouponCode());
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [maxRedemptionsInput, setMaxRedemptionsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedMeta = TYPE_META[selectedType];
  const normalizedExistingCodes = useMemo(
    () =>
      new Set(
        existingCodes
          .map((item) => String(item || "").trim().toUpperCase())
          .filter(Boolean),
      ),
    [existingCodes],
  );
  const normalizedCode = String(code || "").trim().toUpperCase();
  const isCodeDuplicate = normalizedCode
    ? normalizedExistingCodes.has(normalizedCode)
    : false;
  const isCodeValid = Boolean(normalizedCode) && !isCodeDuplicate;

  const salePrice = useMemo(() => {
    if (selectedType === COUPON_TYPES.CUSTOM_PRICE) {
      return Math.max(0, toSafeNumber(customPrice));
    }
    if (selectedType === COUPON_TYPES.CURRENT_BEST_PRICE) {
      return getCurrentBestPrice(basePrice);
    }
    return 0;
  }, [selectedType, customPrice, basePrice]);

  const discountAmount = Math.max(0, basePrice - salePrice);
  const defaultMaxRedemptions = selectedMeta?.maxRedemptions;
  const effectiveMaxRedemptions =
    maxRedemptionsInput !== ""
      ? Number(maxRedemptionsInput)
      : defaultMaxRedemptions;

  const closeModal = () => {
    modalState.setState({ modalInfo: null });
    document.body.style.overflow = "auto";
  };

  const handleNext = () => {
    if (selectedType === COUPON_TYPES.CUSTOM_PRICE) {
      const numericCustomPrice = toSafeNumber(customPrice);
      if (numericCustomPrice <= 0) {
        toast.error("Please enter a valid custom price.");
        return;
      }
      if (numericCustomPrice >= basePrice) {
        toast.error("Custom price must be lower than your base course price.");
        return;
      }
    }

    if (basePrice <= 0 && selectedType !== COUPON_TYPES.FREE_OPEN && selectedType !== COUPON_TYPES.FREE_TARGETED) {
      toast.error("Set a paid course price first before creating this coupon.");
      return;
    }

    if (!endAt) {
      setEndAt(addDaysIso(selectedMeta.expiresInDays));
    }
    setStep(2);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedCode = String(code || "").trim().toUpperCase();
    if (!trimmedCode) {
      toast.error("Coupon code is required.");
      return;
    }
    if (normalizedExistingCodes.has(trimmedCode)) {
      toast.error("Coupon code already exists. Please use a unique code.");
      return;
    }

    if (startAt && endAt && new Date(endAt).getTime() <= new Date(startAt).getTime()) {
      toast.error("End date should be after start date.");
      return;
    }

    if (maxRedemptionsInput !== "") {
      const asNumber = Number(maxRedemptionsInput);
      if (!Number.isInteger(asNumber) || asNumber <= 0) {
        toast.error("Max redemptions must be a positive whole number.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const nowIso = new Date().toISOString();

      const couponRecord = {
        id: `coupon-${Date.now()}`,
        code: trimmedCode,
        couponType: selectedType,
        couponTypeLabel: selectedMeta.label,
        basePrice: Number(basePrice.toFixed(2)),
        salePrice: Number(salePrice.toFixed(2)),
        discountAmount: Number(discountAmount.toFixed(2)),
        startAt: startAt || null,
        endAt: endAt || addDaysIso(selectedMeta.expiresInDays),
        maxRedemptions:
          effectiveMaxRedemptions == null ? null : Number(effectiveMaxRedemptions),
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      if (typeof onSave === "function") {
        await onSave(couponRecord);
      }

      closeModal();
    } catch (_error) {
      // parent callback handles API/persistence errors
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 1) {
    return (
      <div>
        <p className="mt-4 text-lg font-semibold text-slate-text">Pick a coupon type</p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="relative flex cursor-pointer items-start gap-4 rounded-xl border-2 border-gray-100 p-5 transition-all hover:border-primary/30">
            <input
              type="radio"
              name="coupon-type"
              checked={selectedType === COUPON_TYPES.CURRENT_BEST_PRICE}
              onChange={() => setSelectedType(COUPON_TYPES.CURRENT_BEST_PRICE)}
              className="mt-1 h-5 w-5 border-gray-300 text-primary focus:ring-primary"
            />

            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-bold text-slate-text">Current best price</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-text">{toCurrency(getCurrentBestPrice(basePrice))}</p>
                <p className="text-sm text-muted-text">Unlimited redemptions</p>
                <p className="text-sm text-muted-text">Expires in 5 days</p>
              </div>
            </div>
          </label>

          <label className="relative flex cursor-pointer items-start gap-4 rounded-xl border-2 border-gray-100 p-5 transition-all hover:border-primary/30">
            <input
              type="radio"
              name="coupon-type"
              checked={selectedType === COUPON_TYPES.CUSTOM_PRICE}
              onChange={() => setSelectedType(COUPON_TYPES.CUSTOM_PRICE)}
              className="mt-1 h-5 w-5 border-gray-300 text-primary focus:ring-primary"
            />

            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-bold text-slate-text">Custom price</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-text">
                  Set your own sale price
                </p>
                <p className="text-sm text-muted-text">Unlimited redemptions</p>
                <p className="text-sm text-muted-text">Expires in 31 days</p>
              </div>
              {selectedType === COUPON_TYPES.CUSTOM_PRICE && (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={customPrice}
                  onChange={(event) => setCustomPrice(event.target.value)}
                  placeholder="Enter custom sale price"
                  className="mt-3 w-full rounded-lg border border-[#e2e8f0] p-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              )}
            </div>
          </label>

          <label className="relative flex cursor-pointer items-start gap-4 rounded-xl border-2 border-gray-100 p-5 transition-all hover:border-primary/30">
            <input
              type="radio"
              name="coupon-type"
              checked={selectedType === COUPON_TYPES.FREE_OPEN}
              onChange={() => setSelectedType(COUPON_TYPES.FREE_OPEN)}
              className="mt-1 h-5 w-5 border-gray-300 text-primary focus:ring-primary"
            />

            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-bold text-slate-text">Free: Open</span>
              </div>
              <div className="mt-6 space-y-1">
                <p className="text-sm text-muted-text">10 redemptions</p>
                <p className="text-sm text-muted-text">Expires in 5 days</p>
              </div>
            </div>
          </label>

          <label className="relative flex cursor-pointer items-start gap-4 rounded-xl border-2 border-gray-100 p-5 transition-all hover:border-primary/30">
            <input
              type="radio"
              name="coupon-type"
              checked={selectedType === COUPON_TYPES.FREE_TARGETED}
              onChange={() => setSelectedType(COUPON_TYPES.FREE_TARGETED)}
              className="mt-1 h-5 w-5 border-gray-300 text-primary focus:ring-primary"
            />

            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-bold text-slate-text">Free: Targeted</span>
              </div>
              <div className="mt-6 space-y-1">
                <p className="text-sm text-muted-text">100 redemptions</p>
                <p className="text-sm text-muted-text">Expires in 31 days</p>
              </div>
            </div>
          </label>
        </div>

        <footer className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={closeModal}
            className="rounded-full border border-gray-200 px-6 py-2 font-semibold text-slate-text hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="rounded-full bg-primary px-6 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Next
          </button>
        </footer>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="text-sm text-slate-600">
        {selectedMeta.label} coupon configuration.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="block text-sm font-medium">Coupon code</label>
            <button
              type="button"
              onClick={() => setCode(generateCouponCode())}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0056D2] hover:underline"
            >
              <RefreshCw size={14} />
              Regenerate
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              className="w-full rounded-lg border border-[#e2e8f0] p-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {normalizedCode ? (
                isCodeDuplicate ? (
                  <X size={16} className="text-rose-600" />
                ) : (
                  <Check size={16} className="text-emerald-600" />
                )
              ) : null}
            </span>
          </div>
          <p
            className={`mt-1 text-xs ${
              normalizedCode
                ? isCodeDuplicate
                  ? "text-rose-600"
                  : "text-emerald-600"
                : "text-slate-400"
            }`}
          >
            {normalizedCode
              ? isCodeDuplicate
                ? "Coupon code already exists."
                : "Coupon code is available."
              : "Enter a coupon code."}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Start date</label>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(event) => setStartAt(event.target.value)}
            className="w-full rounded-lg border border-[#e2e8f0] p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">End date</label>
          <input
            type="datetime-local"
            value={endAt}
            onChange={(event) => setEndAt(event.target.value)}
            className="w-full rounded-lg border border-[#e2e8f0] p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Max redemptions (optional)
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={maxRedemptionsInput}
            onChange={(event) => setMaxRedemptionsInput(event.target.value)}
            placeholder={
              effectiveMaxRedemptions == null
                ? "Unlimited"
                : String(effectiveMaxRedemptions)
            }
            className="w-full rounded-lg border border-[#e2e8f0] p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm">
        <p className="font-semibold text-slate-700">Coupon preview</p>
        <p className="mt-1 text-slate-600">Base price: {toCurrency(basePrice)}</p>
        <p className="text-slate-600">Discount: {toCurrency(discountAmount)}</p>
        <p className="text-slate-900 font-bold">Sale price: {toCurrency(salePrice)}</p>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="px-4 py-2 rounded-md border border-[#e2e8f0] text-sm font-semibold"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isCodeValid}
          className={`px-4 py-2 rounded-md text-sm font-semibold text-white bg-[#0056D2] ${
            isSubmitting || !isCodeValid ? "opacity-70" : "hover:bg-[#1d6de0]"
          }`}
        >
          {isSubmitting ? "Creating..." : "Create coupon"}
        </button>
      </div>
    </form>
  );
}
