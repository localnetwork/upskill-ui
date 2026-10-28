import Link from "next/link";
import {
  FolderTree,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Users,
  Wallet,
} from "lucide-react";

export const ADMIN_NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "users", label: "Users", icon: Users },
  { key: "courses", label: "Courses", icon: GraduationCap },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "categories", label: "Categories", icon: FolderTree },
  { key: "tags", label: "Tags", icon: Tag },
  { key: "payouts", label: "Payouts", icon: Wallet },
  { key: "roles", label: "Roles", icon: ShieldCheck, href: "/admin/roles" },
  { key: "permissions", label: "Permissions", icon: KeyRound, href: "/admin/permissions" },
];

export default function AdminShell({ activeKey, description, children }) {
  const active = ADMIN_NAV_ITEMS.find((item) => item.key === activeKey);

  return (
    <div className="bg-[#f6f5f1]">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-6 lg:flex-row lg:gap-6 lg:px-6">
        <aside className="lg:sticky lg:top-4 lg:h-fit lg:w-[104px] lg:shrink-0">
          <nav
            aria-label="Admin sections"
            className="flex gap-1 overflow-x-auto rounded-2xl bg-white/70 p-2 lg:flex-col lg:overflow-visible"
          >
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeKey === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href || `/admin?tab=${item.key}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-w-[84px] flex-col items-center gap-1 rounded-xl px-2 py-3 text-center text-[11px] font-semibold leading-tight transition lg:min-w-0 ${isActive ? "bg-white text-[#0056d2] shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white/80"}`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-500">
            <span>Administer</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="font-semibold text-slate-900">{active?.label}</span>
          </p>
          <div className="mt-5 border-b border-slate-200 pb-5">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {active?.label}
            </h1>
            {description && (
              <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>
            )}
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
