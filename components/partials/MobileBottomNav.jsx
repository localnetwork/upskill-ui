import Link from "next/link";
import { useRouter } from "next/router";
import { Compass, GraduationCap, Home, Menu, UserCircle } from "lucide-react";
import persistentStore from "@/lib/store/persistentStore";
import globalStore from "@/lib/store/globalStore";
import cartStore from "@/lib/store/cartStore";

const TABS = [
  { label: "Home", href: "/", Icon: Home },
  { label: "Explore", href: "/categories", Icon: Compass },
  { label: "Courses", href: "/courses", Icon: GraduationCap },
];

export default function MobileBottomNav() {
  const router = useRouter();
  const profile = persistentStore((state) => state.profile);
  const mobileNavOpen = globalStore((state) => state.mobileNavOpen);
  const unreadChats = globalStore((state) => state.unreadChats);
  const unreadNotifications = globalStore((state) => state.unreadNotifications);
  const cartCount = cartStore((state) => state.cartCount);
  const isLearner = Array.isArray(profile?.roles)
    ? profile.roles.includes("LEARNER")
    : false;
  const moreBadge =
    Number(unreadChats || 0) +
    Number(unreadNotifications || 0) +
    (isLearner ? Number(cartCount || 0) : 0);
  const path = router.asPath.split(/[?#]/)[0];

  const isActive = (href) =>
    href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);

  const itemClass = (active) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold transition-colors ${
      active ? "text-primary" : "text-slate-500"
    }`;

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-[60] flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
    >
      {TABS.map(({ label, href, Icon }) => (
        <Link
          key={label}
          href={href}
          className={itemClass(isActive(href))}
          aria-current={isActive(href) ? "page" : undefined}
        >
          <Icon size={22} />
          {label}
        </Link>
      ))}

      {profile ? (
        <button
          type="button"
          onClick={() => globalStore.setState({ mobileNavOpen: true })}
          aria-expanded={mobileNavOpen}
          aria-controls="mobile-nav"
          className={`${itemClass(false)} cursor-pointer`}
        >
          <span className="relative">
            <Menu size={22} />
            {moreBadge > 0 ? (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                {moreBadge > 9 ? "9+" : moreBadge}
              </span>
            ) : null}
          </span>
          More
        </button>
      ) : (
        <Link href="/login" className={itemClass(isActive("/login"))}>
          <UserCircle size={22} />
          Login
        </Link>
      )}
    </nav>
  );
}
