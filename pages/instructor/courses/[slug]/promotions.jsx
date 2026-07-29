import CourseManagementLayout from "@/components/partials/CourseManagementLayout";
import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";
import modalState from "@/lib/store/modalState";
import { useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";

function parsePrice(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = String(value || "").replace(/[^0-9.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function resolveStatus(coupon) {
  const now = Date.now();
  const start = coupon?.startAt ? new Date(coupon.startAt).getTime() : null;
  const end = coupon?.endAt ? new Date(coupon.endAt).getTime() : null;

  if (start && start > now) return "SCHEDULED";
  if (end && end < now) return "EXPIRED";
  return "ACTIVE";
}

export async function getServerSideProps(context) {
  const { slug } = context.params;
  setContext(context);

  try {
    const response = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/courses/${slug}/manage`,
    );
    return {
      props: {
        course: response?.data?.data || null,
      },
    };
  } catch (_error) {
    return { notFound: true };
  }
}

export default function CoursePromotionsPage({ course }) {
  const [coupons, setCoupons] = useState([]);
  const [expiredSearch, setExpiredSearch] = useState("");
  const courseUuid = course?.uuid || course?.id || "";

  const basePrice = useMemo(
    () =>
      parsePrice(
        course?.price_tier?.price ??
          course?.price_tier?.title ??
          course?.priceTier?.price ??
          0,
      ),
    [course],
  );

  const referralLink = useMemo(() => {
    if (!course?.slug) return "";
    if (typeof window !== "undefined") {
      return `${window.location.origin}/courses/${course.slug}?referralCode=${courseUuid || "UPSKILL"}`;
    }
    return `/courses/${course?.slug}`;
  }, [course?.slug, courseUuid]);

  const fetchCoupons = async () => {
    if (!courseUuid) {
      setCoupons([]);
      return;
    }
    try {
      const response = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseUuid}/coupons`,
        { params: { nocache: true } },
      );
      setCoupons(Array.isArray(response?.data?.data) ? response.data.data : []);
    } catch (_error) {
      setCoupons([]);
      toast.error("Unable to load coupons.");
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [courseUuid]);

  const openCreateCouponModal = () => {
    modalState.setState({
      modalInfo: {
        type: "COURSE_PROMOTION",
        size: "lg",
        title: "Create a new coupon",
        data: {
          basePrice,
          existingCodes: coupons.map((item) => String(item?.code || "")),
          onSave: async (record) => {
            await BaseApi.post(
              `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseUuid}/coupons`,
              {
                code: record.code,
                salePrice: Number(record.salePrice || 0),
                startAt: record.startAt || null,
                endAt: record.endAt || null,
                maxRedemptions: record.maxRedemptions || null,
                couponType: record.couponType || "CUSTOM_PRICE",
              },
            );
            await fetchCoupons();
            toast.success("Coupon created.");
          },
        },
      },
    });
  };

  const copyReferralLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Copied!");
    } catch (_error) {
      toast.error("Failed to copy link.");
    }
  };

  const activeCoupons = useMemo(
    () =>
      coupons
        .filter((item) => ["ACTIVE", "SCHEDULED"].includes(resolveStatus(item)))
        .sort(
          (a, b) =>
            new Date(b?.createdAt || 0).getTime() -
            new Date(a?.createdAt || 0).getTime(),
        ),
    [coupons],
  );

  const expiredCoupons = useMemo(
    () =>
      coupons
        .filter((item) => resolveStatus(item) === "EXPIRED")
        .filter((item) =>
          String(item?.code || "")
            .toLowerCase()
            .includes(String(expiredSearch || "").toLowerCase()),
        ),
    [coupons, expiredSearch],
  );

  return (
    <CourseManagementLayout
      course={course}
      activeTab="promotions"
      title="Promotions"
    >
      <div className="space-y-6">
        <section className="flex-1 bg-surface p-8 lg:p-12">
          <div className="mx-auto mb-10 max-w-5xl">
            <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-on-background">
              Promotions
            </h1>
            <p className="text-lg text-on-surface-variant">
              Drive enrollment and grow your audience with tailored coupons and
              referral tools.
            </p>
          </div>

          <div className="mx-auto max-w-5xl space-y-8">
            <div className="flex items-start gap-4 rounded-r-lg border-l-4 border-primary bg-primary-container p-6">
              <span className="material-symbols-outlined mt-0.5 text-primary">
                info
              </span>
              <div>
                <p className="mb-1 font-bold text-on-primary-fixed">
                  New Coupon System Update
                </p>
                <p className="text-sm leading-relaxed text-on-primary-fixed/80">
                  Create structured coupons with schedule and redemption limits.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="group relative overflow-hidden rounded-lg border border-outline bg-white p-8 transition-shadow hover:shadow-md md:col-span-2">
                <div className="absolute right-0 top-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
                  <span className="material-symbols-outlined text-9xl">
                    share
                  </span>
                </div>

                <h2 className="mb-2 text-xl font-bold">Refer students</h2>
                <p className="mb-6 max-w-md text-sm text-on-surface-variant">
                  Any time a student uses this link, we will credit you with the
                  sale. Use this for your social media or personal website.
                </p>

                <div className="flex items-stretch gap-2 rounded-full border border-outline bg-surface-container-low p-1">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="flex-1 truncate border-none bg-transparent px-4 font-mono text-sm text-on-surface focus:ring-0"
                  />

                  <button
                    type="button"
                    onClick={copyReferralLink}
                    className="rounded-full bg-secondary px-6 py-2 text-xs font-bold text-white transition-colors hover:bg-brave-dark"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-lg border border-outline bg-white p-8 transition-shadow hover:shadow-md">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Coupons</h2>
                    <span className="rounded-md bg-primary-container px-2 py-1 text-xs font-black text-primary">
                      {basePrice > 0 ? "AVAILABLE" : "SET PRICE FIRST"}
                    </span>
                  </div>

                  <p className="mb-6 text-sm text-on-surface-variant">
                    Base course price:{" "}
                    <span className="font-semibold">
                      {basePrice > 0 ? formatCurrency(basePrice) : "Free / Not set"}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openCreateCouponModal}
                  disabled={basePrice <= 0}
                  className="w-full rounded-full bg-primary py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Create coupon
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-outline bg-white">
              <div className="flex items-center justify-between border-b border-outline p-6">
                <h3 className="text-lg font-bold">Active/Scheduled coupons</h3>
              </div>

              {activeCoupons.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low">
                    <span className="material-symbols-outlined text-4xl text-outline-variant">
                      local_offer
                    </span>
                  </div>
                  <p className="font-medium text-on-surface-variant">
                    No active coupons found
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    When you create a coupon, it will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#e2e8f0]">
                  {activeCoupons.map((item) => (
                    <div key={item.id} className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">{item.code}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {item.couponTypeLabel} • {resolveStatus(item)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-[#0f766e]">
                          {formatCurrency(item.salePrice)}
                        </p>
                      </div>
                      <div className="mt-2 text-xs text-slate-500 grid md:grid-cols-3 gap-2">
                        <p>Discount: {formatCurrency(item.discountAmount)}</p>
                        <p>
                          Remaining:{" "}
                          {item.maxRedemptions == null
                            ? "Unlimited"
                            : `${Math.max(
                                0,
                                Number(item.remainingRedemptions ?? item.maxRedemptions),
                              )} / ${item.maxRedemptions}`}
                        </p>
                        <p>
                          Expires: {item.endAt ? formatDate(item.endAt) : "No expiry"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-lg border border-outline bg-white">
              <div className="flex flex-col items-center justify-between gap-4 border-b border-outline p-6 md:flex-row">
                <h3 className="text-lg font-bold">Expired coupons</h3>

                <div className="relative w-full md:w-80">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    search
                  </span>

                  <input
                    type="text"
                    value={expiredSearch}
                    onChange={(event) => setExpiredSearch(event.target.value)}
                    placeholder="Search coupon code..."
                    className="w-full rounded-full border-none bg-slate-50 py-2 pl-10 pr-4 text-sm transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {expiredCoupons.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <p className="font-medium text-on-surface-variant">
                    No expired coupons to show
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#e2e8f0]">
                  {expiredCoupons.map((item) => (
                    <div key={item.id} className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold">{item.code}</p>
                        <p className="text-sm font-semibold text-slate-700">
                          {formatCurrency(item.salePrice)}
                        </p>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Expired on {formatDate(item.endAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </CourseManagementLayout>
  );
}
