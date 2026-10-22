import Link from "next/link";
import { useRouter } from "next/router";

export default function ProfileNavTabs() {
  const router = useRouter();

  const links = [
    { name: "Upskill Profile", href: "/profile/basic-information" },
    { name: "Profile Picture", href: "/profile/photo" },
  ];

  return (
    <div className="mt-[30px] mb-[20px] w-full min-w-0 overflow-x-auto shadow-[inset_0_-1px_0_0_#d1d2e0]">
      <nav className="flex min-w-max items-center gap-4 sm:gap-6">
        {links.map((link) => {
          const isActive = router.pathname === link.href;

          return (
            <div key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative inline-block rounded-md py-2 text-base font-semibold transition-colors hover:text-black sm:text-lg lg:text-[20px] ${
                  isActive ? "text-black" : "text-[#595c73]"
                }`}
              >
                {link.name}

                {isActive && (
                  <span className="absolute bottom-[1px] left-0 h-[1px] w-full rounded-md bg-black" />
                )}
              </Link>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
