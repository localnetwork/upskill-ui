import { ArrowDown, ChevronDown, Plus } from "lucide-react";

export default function FAQsBlock() {
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
    <>
      <section class="px-6 md:px-8 py-24 max-w-4xl mx-auto">
        <div class="text-center mb-16">
          <p class="text-primary font-black uppercase tracking-[0.2em] text-xs mb-4">
            Questions
          </p>
          <h2 class="text-4xl md:text-5xl font-bold text-slate-900 mb-12 text-center font-secondary">
            Common questions
            <br />
            you need to know.
          </h2>
          <p class="text-on-surface-variant mt-4">
            Still have questions? Our team is here to help — reach out anytime.
          </p>
        </div>
        <div class="space-y-4">
          {faqItems.map((item, index) => (
            <div
              class="border border-[#e2e8f0] rounded-lg bg-surface overflow-hidden transition-all accordion-item duration-700 opacity-100 translate-y-0"
              key={index}
            >
              <button class="w-full px-6 py-5 text-left flex justify-between items-center font-bold text-[#0f111a]">
                {item?.question}
                <ChevronDown className="transition-transform" />
              </button>
              <div class="accordion-content">
                <div class="px-6 pb-5 text-on-surface-variant leading-relaxed">
                  {item?.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
