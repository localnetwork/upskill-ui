import { Plus } from "lucide-react";

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
    <section class="py-24 border-t border-slate-100">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-4xl font-secondary font-bold text-slate-900 mb-12 text-center">
          Frequently Asked Questions
        </h2>
        <div class="space-y-4">
          {faqItems.map((item, index) => (
            <details
              class="group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
              open=""
            >
              <summary class="flex items-center justify-between p-6 cursor-pointer list-none">
                <span class="font-bold text-slate-900">{item.question}</span>
                <Plus className="transition-transform group-open:rotate-180 text-primary" />
              </summary>
              <div class="px-6 pb-6 text-slate-600 text-sm leading-relaxed border-t border-slate-50 pt-4">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
