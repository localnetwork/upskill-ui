import { ChevronDown } from "lucide-react";
import { useRef } from "react";
import useSectionReveal from "@/components/home/useSectionReveal";

export default function FAQsBlock() {
  const sectionRef = useRef(null);
  useSectionReveal(sectionRef, { stagger: 0.08 });

  const faqItems = [
    {
      question: "Can I get a refund if I'm not satisfied?",
      answer:
        "Yes, we offer a full 14-day money-back guarantee for all our professional certificates and single courses. If you're not satisfied, simply contact support.",
    },
    {
      question: "Are these certificates recognized by employers?",
      answer:
        "Absolutely. Our certifications are developed in partnership with industry giants and top-tier universities, making them highly respected in the job market globally.",
    },
    {
      question: "How long do I have access to the materials?",
      answer:
        "Once you enroll in a course, you have lifetime access to the curriculum, including any future updates. You can learn at your own pace anytime, anywhere.",
    },
  ];

  return (
    <section
      id="faq"
      ref={sectionRef}
      data-home-section=""
      className="bg-white py-20 md:py-24"
    >
      <div className="container max-w-5xl">
        <div data-reveal="" className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Common questions from new learners.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Get clear answers about access, certificates, and support before
            starting your first track.
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <details
              key={index}
              data-reveal=""
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-6 transition-colors duration-300 open:bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-left font-semibold text-slate-900">
                {item.question}
                <ChevronDown className="h-5 w-5 text-slate-500 transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <p className="pb-5 pr-6 leading-relaxed text-slate-600">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
