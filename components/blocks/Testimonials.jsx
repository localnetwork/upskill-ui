import { useRef } from "react";
import useSectionReveal from "@/components/home/useSectionReveal";

export default function Testimonials() {
  const sectionRef = useRef(null);
  useSectionReveal(sectionRef, { stagger: 0.1 });

  const testimonials = [
    {
      name: "Angela Rivera",
      role: "Frontend Engineer, Stripe",
      quote:
        "The project feedback loops changed how I build. I landed interviews within six weeks of finishing my path.",
    },
    {
      name: "Noah Patel",
      role: "Data Analyst, Canva",
      quote:
        "I finally understood how to connect analytics concepts to business decisions. The mentor support was excellent.",
    },
    {
      name: "Mina Okafor",
      role: "Product Designer, Atlassian",
      quote:
        "Each module felt practical and current. My capstone became a portfolio case study that recruiters actually asked about.",
    },
  ];

  return (
    <section
      id="student-testimonials"
      ref={sectionRef}
      data-home-section=""
      className="overflow-hidden bg-slate-50 py-20 md:py-24"
    >
      <div className="container">
        <div data-reveal="" className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Learners who changed careers with confidence.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
            Outcomes matter. These stories come from learners who completed
            projects, built portfolios, and moved into new roles.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <article
            data-reveal=""
            className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <p className="text-lg leading-relaxed text-slate-700">
              "{testimonials[0].quote}"
            </p>
            <div className="mt-8 border-t border-slate-100 pt-5">
              <p className="font-semibold text-slate-900">{testimonials[0].name}</p>
              <p className="text-sm text-slate-500">{testimonials[0].role}</p>
            </div>
          </article>

          <div className="grid gap-5">
            {testimonials.slice(1).map((item) => (
              <article
                key={item.name}
                data-reveal=""
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <p className="leading-relaxed text-slate-700">"{item.quote}"</p>
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
