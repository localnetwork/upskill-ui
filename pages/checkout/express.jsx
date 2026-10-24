import Image from "next/image";
import Link from "next/link";
import { Check, ChevronLeft, CreditCard, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";
import Spinner from "@/components/icons/Spinner";

export default function ExpressCheckout() {
  const router = useRouter();
  const { slug: rawSlug, coupon: rawCoupon, subscription_id: subscriptionId, status: returnStatus } = router.query;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const couponCode = String(
    Array.isArray(rawCoupon) ? rawCoupon[0] : rawCoupon || "",
  )
    .trim()
    .toUpperCase();
  const [course, setCourse] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const lockedSubscribe = router.query.mode === "subscribe";
  const [mode, setMode] = useState(router.query.mode === "buy" ? "buy" : "subscribe");
  const [plans, setPlans] = useState([]);
  const [planId, setPlanId] = useState("");
  const [catalogCount, setCatalogCount] = useState(0);
  const [hasSubscription, setHasSubscription] = useState(false);

  const cookie = parseCookies();

  useEffect(() => {
    if (!cookie[process.env.NEXT_PUBLIC_TOKEN]) {
      router.replace("/login");
      return;
    }
  }, [cookie, router]);

  useEffect(() => {
    async function loadCourse() {
      if (!slug) return;

      try {
        setLoadingCourse(true);
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/route/${slug}`,
        );
        const data = response?.data || null;
        if (!data) {
          router.replace("/courses");
          return;
        }
        if (data?.is_enrolled) {
          router.replace(`/courses/${data.slug}/learn`);
          return;
        }
        setCourse(data);
      } catch (_error) {
        toast.error("Unable to load course for express checkout.");
        router.replace("/courses");
      } finally {
        setLoadingCourse(false);
      }
    }

    loadCourse();
  }, [slug, router]);

  // Xendit sends the learner back here after the card is saved; the webhook may land a moment later.
  useEffect(() => {
    if (!router.isReady || !slug) return;
    if (returnStatus === "canceled") {
      toast("Subscription checkout was canceled.");
      return;
    }
    if (!subscriptionId) return;
    let cancelled = false;
    const confirm = async (attempt) => {
      try {
        await BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/subscription/confirm`, { subscriptionId });
        toast.success("Subscription activated. Enjoy learning!");
      } catch (error) {
        if (!cancelled && error?.status === 409 && attempt < 8) {
          setTimeout(() => confirm(attempt + 1), 2500);
          return;
        }
        toast.error(error?.data?.message || "Could not confirm subscription.");
        return;
      }

      // A subscription alone doesn't enroll; open this course with the plan before heading to the player.
      try {
        const api = process.env.NEXT_PUBLIC_API_URL;
        const courseRes = await BaseApi.get(`${api}/courses/route/${slug}`);
        const courseId = courseRes?.data?.id;
        if (courseId) await BaseApi.post(`${api}/subscription/course/${courseId}/access`);
        router.replace(`/courses/${slug}/learn`);
      } catch (error) {
        toast.error(error?.data?.message || "Could not open this course with your plan.");
        router.replace(`/courses/${slug}`);
      }
    };
    confirm(0);
    return () => {
      cancelled = true;
    };
  }, [router.isReady, slug, subscriptionId, returnStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL;
    Promise.all([
      BaseApi.get(`${api}/subscription/plans`),
      BaseApi.get(`${api}/subscription/catalog-summary`),
      BaseApi.get(`${api}/subscription/me`),
    ])
      .then(([plansRes, catalogRes, meRes]) => {
        const list = plansRes?.data?.data || [];
        setPlans(list);
        const preferred = list.find((plan) => plan.interval === "YEAR") || list[0];
        setPlanId(preferred?.id || "");
        setCatalogCount(Number(catalogRes?.data?.data?.courseCount || 0));
        const subscribed = Boolean(meRes?.data?.data?.hasSubscription);
        setHasSubscription(subscribed);
        if (list.length === 0 || subscribed) setMode("buy");
      })
      .catch(() => setMode("buy"));
  }, []);

  const selectedPlan = plans.find((plan) => plan.id === planId) || null;
  const planPrice = (plan) => `?${Number(plan.price).toLocaleString()}`;
  const planPerMonth = (plan) =>
    plan.interval === "YEAR" ? Number(plan.price) / 12 : Number(plan.price);
  const savingsPct = (plan) => {
    const monthly = plans.find((item) => item.interval === "MONTH");
    if (!monthly || plan.interval !== "YEAR" || plan.firstCyclePrice == null) return 0;
    return Math.round((1 - plan.firstCyclePrice / (Number(monthly.price) * 12)) * 100);
  };
  const dueToday = (plan) =>
    plan.firstCyclePrice != null ? Number(plan.firstCyclePrice) : Number(plan.price);

  const handleSubscribe = async () => {
    if (!selectedPlan || !course) return;
    try {
      setIsLoading(true);
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/subscription/subscribe`,
        { planId: selectedPlan.id, next: `/checkout/express?slug=${encodeURIComponent(course.slug)}` },
      );
      const approveUrl = response?.data?.data?.approveUrl;
      if (!approveUrl) throw new Error("missing approve url");
      window.location.href = approveUrl;
    } catch (error) {
      setIsLoading(false);
      toast.error(error?.data?.message || "Unable to start subscription checkout.");
    }
  };

  const handleCheckout = async () => {
    if (!course) return;

    try {
      setIsLoading(true);
      const payload = {
        courseId: course.id,
        couponCode: couponCode || undefined,
        couponCodes: couponCode ? [couponCode] : undefined,
      };
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/checkout`,
        payload,
      );

      if (response?.data?.data?.reusedCheckout) {
        toast("You already have a checkout in progress. Opening transaction...");
        const providerOrderId = response?.data?.data?.providerOrderId;
        if (providerOrderId) {
          router.push(
            `/checkout/payments/${encodeURIComponent(providerOrderId)}`,
          );
          return;
        }
      }

      if (response.data.redirect_url) {
        router.push(response.data.redirect_url);
        return;
      }

      setIsLoading(false);
      toast.error("Unable to start express checkout. Please try again.");
    } catch (error) {
      setIsLoading(false);
      toast.error(error?.data?.message || "Unable to process express checkout.");
    }
  };


  const subscribeDetails = (
    <div className="space-y-3">
                    {plans.map((plan) => (
                      <label key={plan.id} className={`flex cursor-pointer items-center justify-between rounded-md border p-3 ${planId === plan.id ? "border-[#0056D2]" : "border-slate-300"} ${plan.available ? "" : "opacity-50"}`}>
                        <span>
                          <input type="radio" className="mr-2" disabled={!plan.available} checked={planId === plan.id} onChange={() => setPlanId(plan.id)} />
                          <span className="font-semibold">{plan.interval === "YEAR" ? "Yearly" : "Monthly"}</span>
                          {savingsPct(plan) > 0 && (
                            <span className="ml-2 text-sm font-semibold text-emerald-700">Save {savingsPct(plan)}% the first year</span>
                          )}
                          {!plan.available && <span className="ml-2 text-xs text-slate-500">(coming soon)</span>}
                        </span>
                        <span className="text-right">
                          {plan.interval === "YEAR" && plan.firstCyclePrice != null ? (
                            <>
                              <span className="font-semibold">?{plan.firstCyclePrice.toLocaleString()}/yr</span>
                              <span className="block text-xs text-slate-500 line-through">{planPrice(plan)}/yr</span>
                            </>
                          ) : (
                            <span className="font-semibold">{planPrice(plan)}/{plan.interval === "YEAR" ? "yr" : "mo"}</span>
                          )}
                        </span>
                      </label>
                    ))}
                    <div>
                      <p className="mb-2 text-sm font-semibold">What&apos;s included</p>
                      <ul className="space-y-1 text-sm text-slate-700">
                        {[
                          catalogCount > 0
                            ? `Access to over ${catalogCount} of our top courses in tech, business, and more`
                            : "Access to our top courses in tech, business, and more",
                          "Hands-on learning experiences to build your skills",
                          "Course recommendations to help you start learning faster",
                        ].map((item) => (
                          <li key={item} className="flex gap-2"><Check size={16} className="mt-0.5 text-emerald-600" />{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
  );

  const price = course?.price_tier?.title?.toLowerCase() === "free" ? "Free" : `₱${course?.price_tier?.price || 0}`;

  return (
    <div className="bg-[linear-gradient(90deg,transparent_60%,oklch(97.59%_0.0029_264.54deg)_40%)] min-h-[calc(100vh-70px)] py-[30px]">
      <div className="max-w-[984px] mx-auto flex justify-between gap-[50px] px-[15px]">
        <div className="py-[50px] max-w-[calc(100%-320px)] w-full pr-[50px]">
          <Link
            href={course?.slug ? `/courses/${course.slug}` : "/courses"}
            className="flex items-center gap-[5px] mb-5 mt-[-50px]"
          >
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-[20px] font-semibold mb-5">Express checkout</h1>

          {loadingCourse ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Spinner className="animate-spin" />
              Loading course...
            </div>
          ) : course ? (
            <div>
              <h2 className="text-[18px] font-semibold mb-2">Order details (1 course)</h2>
              <div className="flex justify-between">
                <div className="flex items-center gap-[10px]">
                  <Image
                    src={course?.cover_image?.path || "/placeholder-cover.webp"}
                    width={70}
                    height={50}
                    alt={course?.title || "Course"}
                    className="w-[70px] h-[50px] object-cover rounded-md border-[1px] border-[oklch(86.72%_0.0192_282.72deg)]"
                  />
                  <div className="font-semibold">{course?.title}</div>
                </div>
                <div className="font-light">{price}</div>
              </div>
            </div>
          ) : null}

          {course && plans.length > 0 && !hasSubscription && lockedSubscribe && (
            <div className="mt-8 space-y-5">
              <div>
                <h2 className="mb-3 text-[18px] font-semibold">Choose your billing</h2>
                {subscribeDetails}
              </div>
              <div>
                <h2 className="mb-3 text-[18px] font-semibold">Payment method</h2>
                <div className="flex items-start gap-3 rounded-lg border border-[#0056D2] bg-blue-50 p-4">
                  <CreditCard size={20} className="mt-0.5 text-[#0056D2]" />
                  <div>
                    <p className="font-semibold">Credit or debit card</p>
                    <p className="mt-1 text-sm text-slate-600">
                      You&apos;ll enter your card details on Xendit&apos;s secure payment page. The card is saved to your
                      account and charged automatically each billing period.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {course && plans.length > 0 && !hasSubscription && !lockedSubscribe && (
            <div className="mt-8 space-y-3">
              <h2 className="text-[18px] font-semibold">Choose how to learn</h2>
              <label className={`block cursor-pointer rounded-lg border p-4 ${mode === "subscribe" ? "border-[#0056D2] bg-blue-50" : "border-slate-300"}`}>
                <input type="radio" className="mr-2" checked={mode === "subscribe"} onChange={() => setMode("subscribe")} />
                <span className="font-semibold">Subscribe &amp; Save</span>
                <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Best value</span>
                {mode === "subscribe" && subscribeDetails}
              </label>
              <label className={`block cursor-pointer rounded-lg border p-4 ${mode === "buy" ? "border-[#0056D2] bg-blue-50" : "border-slate-300"}`}>
                <input type="radio" className="mr-2" checked={mode === "buy"} onChange={() => setMode("buy")} />
                <span className="font-semibold">Buy this course</span>
                <span className="ml-2 text-sm text-slate-600">{price} one-time, yours forever</span>
              </label>
            </div>
          )}
        </div>

        <div className="w-[350px] pl-[10px] py-[50px]">
          <h2 className="font-semibold text-[25px] mb-2">Order summary</h2>
          {mode === "subscribe" && selectedPlan ? (
            <div>
              <div className="flex justify-between text-[15px]">
                <div>{selectedPlan.interval === "YEAR" ? "Yearly" : "Monthly"} plan</div>
                <div>{planPrice(selectedPlan)}</div>
              </div>
              {selectedPlan.firstCyclePrice != null && (
                <div className="flex justify-between text-[15px] text-emerald-700">
                  <div>First-year discount</div>
                  <div>-?{(Number(selectedPlan.price) - selectedPlan.firstCyclePrice).toLocaleString()}</div>
                </div>
              )}
              <div className="mt-2 flex justify-between">
                <div className="font-semibold text-[18px]">Total today:</div>
                <div className="font-semibold text-[18px]">?{dueToday(selectedPlan).toLocaleString()}</div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {selectedPlan.interval === "YEAR"
                  ? `Renews yearly at ${planPrice(selectedPlan)} (about ?${Math.round(planPerMonth(selectedPlan)).toLocaleString()}/month). Cancel anytime.`
                  : `Renews monthly at ${planPrice(selectedPlan)}. Cancel anytime.`}
              </p>
              <div className="mt-4 rounded-md border border-slate-200 p-3 text-xs text-gray-600">
                <div className="mb-1 flex items-center gap-2 font-semibold text-slate-800"><CreditCard size={16} />Payment method</div>
                Credit or debit card, entered on Xendit's secure page. Saved to your account and charged automatically each billing period.
              </div>
            </div>
          ) : (
            <div className="flex justify-between">
              <div className="font-semibold text-[18px]">Total:</div>
              <div className="font-semibold text-[18px]">{price}</div>
            </div>
          )}

          <div className="border-t border-[#ddd] mt-[30px] pt-[30px]">
            <p className="text-[14px] text-gray-500">
              By completing your purchase, you agree to these{" "}
              <Link href="/terms-of-use" target="_blank" className="text-[#0056D2]">
                Terms of Use
              </Link>
              .
            </p>

            <button
              onClick={mode === "subscribe" ? handleSubscribe : handleCheckout}
              disabled={isLoading || loadingCourse || !course || (mode === "subscribe" && !selectedPlan?.available)}
              className={`${isLoading || loadingCourse || !course || (mode === "subscribe" && !selectedPlan?.available) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} bg-[#0056D2] gap-[5px] flex items-center justify-center w-full mt-[30px] min-w-[150px] font-semibold text-white px-[30px] py-[12px] rounded-[5px] hover:bg-[#1d6de0]`}
            >
              {isLoading ? (
                <Spinner className="animate-spin" />
              ) : (
                <>
                  <LockKeyhole size={20} />
                  {mode === "subscribe" ? "Subscribe" : "Proceed"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
