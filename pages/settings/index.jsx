import { Shield, User, Bell, Lock, ChevronRight, Wallet } from "lucide-react";

export default function Page() {
  const links = [
    {
      name: "Security",
      href: "/settings/security",
      icon: Shield,
      description: "Passwords, two-factor authentication",
    },
    {
      name: "Account",
      href: "/settings/account",
      icon: User,
      description: "Profile info, email, username",
    },
    {
      name: "Notifications",
      href: "/settings/notifications",
      icon: Bell,
      description: "Alerts, emails, push notifications",
    },
    {
      name: "Privacy",
      href: "/settings/privacy",
      icon: Lock,
      description: "Data usage, visibility, permissions",
    },
    {
      name: "Payout & Tax",
      href: "/settings/payout",
      icon: Wallet,
      description: "Bank info, tax forms, earnings",
    },
  ];

  return (
    <div className="container py-[50px] max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-gray-500 mb-8">
        Manage your account settings and preferences here.
      </p>

      <div className="flex flex-col gap-2">
        {links.map(({ name, href, icon: Icon, description }) => (
          <a
            key={name}
            href={href}
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all group"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors shrink-0">
              <Icon className="w-5 h-5 text-gray-600" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900">{name}</div>
              <div className="text-sm text-gray-500 truncate">
                {description}
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}
