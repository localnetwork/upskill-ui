import InstructorLayout from "../../../components/partials/InstructorLayout";
import Link from "next/link";
import {
  ChevronRight,
  CircleDollarSign,
  Lock,
  UserCircle2,
} from "lucide-react";

export default function Page() {
  const links = [
    {
      name: "Payout settings",
      href: "/instructor/settings/payout",
      icon: CircleDollarSign,
      description:
        "Connect PayPal, review payout history, and request cashout.",
    },
  ];

  return (
    <InstructorLayout>
      <div className="mx-auto w-full space-y-6">
        <div className="flex flex-wrap gap-2 border-b border-[#e2e8f0] pb-3">
          <Link
            href="/instructor/settings"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            General
          </Link>
          <Link
            href="/instructor/settings/payout"
            className="rounded-full border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Payout
          </Link>
        </div>

        <section className="rounded-lg border border-[#e2e8f0] bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-on-surface">
            Instructor settings
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Manage your instructor account preferences and payout configuration.
          </p>
        </section>

        <div className="space-y-3">
          {links.map(({ name, href, icon: Icon, description }) => (
            <Link
              key={name}
              href={href}
              className="group flex items-center gap-4 rounded-xl border border-[#e2e8f0] bg-white p-4 hover:bg-slate-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-200">
                <Icon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-on-surface">{name}</p>
                <p className="text-sm text-on-surface-variant">{description}</p>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </Link>
          ))}
        </div>
      </div>
    </InstructorLayout>
  );
}
