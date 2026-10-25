import {
  BadgeCheck,
  Briefcase,
  Clock,
  MessageCircle,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

const reasons = [
  {
    icon: Clock,
    title: "Learn at your pace",
    text: "Study anytime, anywhere. Lifetime access on all your devices.",
    tone: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: UserCheck,
    title: "Expert instructors",
    text: "Learn from industry experts and top professionals.",
    tone: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: BadgeCheck,
    title: "Certificates",
    text: "Earn certificates to boost your career and showcase skills.",
    tone: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: Briefcase,
    title: "Practical projects",
    text: "Build real-world projects and create an impressive portfolio.",
    tone: "bg-violet-100 text-violet-600",
  },
  {
    icon: MessageCircle,
    title: "Community support",
    text: "Join a global community of learners and get help anytime.",
    tone: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: ShieldCheck,
    title: "Money-back guarantee",
    text: "30-day money-back guarantee. No questions asked.",
    tone: "bg-amber-100 text-amber-600",
  },
];

export default function WhyLearnersChooseSection() {
  return (
    <section data-home-section="" className="bg-white py-12">
      <div className="container">
        <h2 className="text-xl font-semibold text-slate-900">
          Why learners choose Upskill
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {reasons.map(({ icon: Icon, title, text, tone }) => (
            <div
              key={title}
              className="rounded-xl bg-slate-50 p-4 transition-shadow hover:shadow-md"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}
              >
                <Icon size={18} />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                {title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
