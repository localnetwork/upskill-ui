import { useRef } from "react";
import { Check } from "lucide-react";
import MagneticButton from "@/components/home/MagneticButton";
import useSectionReveal from "@/components/home/useSectionReveal";

const PLANS = [
  {
    title: "Starter",
    price: "₱0",
    cadence: "for 7 days",
    description: "Try core courses, beginner projects, and progress tracking.",
    features: ["Access to selected courses", "Community discussion access", "Progress dashboard"],
    ctaLabel: "Start free trial",
    href: "/register?mode=student",
    highlighted: false,
  },
  {
    title: "Pro",
    price: "₱1,490",
    cadence: "per month",
    description: "Full catalog access with mentorship and certificate pathways.",
    features: ["All courses and paths", "Mentor feedback sessions", "Capstone certificate support"],
    ctaLabel: "Choose Pro",
    href: "/checkout",
    highlighted: true,
  },
  {
    title: "Teams",
    price: "Custom",
    cadence: "for organizations",
    description: "Train your team with learning analytics and cohort management.",
    features: ["Team seats and billing", "Learning analytics", "Dedicated onboarding support"],
    ctaLabel: "Talk to sales",
    href: "/contact-us",
    highlighted: false,
  },
];

export default function PricingSection() {
  const sectionRef = useRef(null);
  useSectionReveal(sectionRef, { stagger: 0.08 });

  return (
    <section
      id="pricing"
      ref={sectionRef}
      data-home-section=""
      className="bg-slate-50 py-18 md:py-22"
    >
      <div className="container">
        <div data-reveal="" className="mx-auto mb-10 max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Pricing designed for learners and teams.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Start free, upgrade when ready, and choose the plan that matches your
            goals and pace.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.title}
              data-reveal=""
              className={`${plan.highlighted ? "border-primary bg-white shadow-[0_20px_50px_rgba(0,82,204,0.16)]" : "border-slate-200 bg-white"} rounded-3xl border p-7`}
            >
              <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{plan.title}</h3>
              <p className="mt-4 text-4xl font-semibold text-slate-950">{plan.price}</p>
              <p className="mt-1 text-sm text-slate-500">{plan.cadence}</p>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">{plan.description}</p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                <MagneticButton
                  href={plan.href}
                  className={`${plan.highlighted ? "bg-primary text-white" : "bg-slate-100 text-slate-900"} inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-colors duration-300 hover:bg-slate-900 hover:text-white`}
                  ariaLabel={plan.ctaLabel}
                >
                  {plan.ctaLabel}
                </MagneticButton>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
