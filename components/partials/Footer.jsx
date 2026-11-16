import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BaseApi from "@/lib/api/_base.api";

const byPopularity = (a, b) =>
  (b.learners_count || 0) - (a.learners_count || 0) ||
  (b.courses_count || 0) - (a.courses_count || 0) ||
  String(a.name || a.title).localeCompare(String(b.name || b.title));

const labelOf = (item) => item.name || item.title;

const companyGroups = [
  {
    title: "About",
    links: [
      { label: "About us", href: "/about" },
      { label: "Contact us", href: "/contact-us" },
      { label: "Teach on Upskill", href: "/register?mode=instructor" },
    ],
  },
  {
    title: "Discover Upskill",
    links: [
      { label: "Courses", href: "/courses" },
      { label: "Learning dashboard", href: "/my-courses/learning" },
      { label: "Certificates", href: "/my-courses/certificates" },
      { label: "Wishlist", href: "/my-courses/wishlist" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help and Support", href: "/contact-us" },
      { label: "Account security", href: "/settings/security" },
      { label: "Notifications", href: "/notifications" },
      { label: "Activity log", href: "/settings/activity-log" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms-conditions" },
    ],
  },
];

const linkClass =
  "text-[13px] text-[#1f1f1f] transition-colors hover:underline";

const Footer = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let active = true;
    BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/categories?tree=true`)
      .then((res) => {
        if (active) setCategories(res?.data?.data || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const skillGroups = useMemo(
    () =>
      [...categories]
        .filter((c) => (c.courses_count || 0) > 0)
        .sort(byPopularity)
        .slice(0, 8)
        .map((c) => ({
          id: c.id,
          title: labelOf(c),
          href: `/categories/${c.slug}`,
          links: [...(c.children || [])]
            .filter((child) => (child.courses_count || 0) > 0)
            .sort(byPopularity)
            .slice(0, 5)
            .map((child) => ({
              id: child.id,
              label: labelOf(child),
              href: `/categories/${child.slug}`,
            })),
        })),
    [categories],
  );

  return (
    <footer className="text-white relative z-[9999]">
      {skillGroups.length > 0 && (
        <div className="border-t border-white/20 bg-[#F1F5F9]">
          <div className="container py-12">
            <h2 className="text-lg font-bold text-[#1f1f1f]">
              Explore top skills and certifications
            </h2>
            <div className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {skillGroups.map((group) => (
                <div key={group.id}>
                  <h3 className="text-[15px] font-bold text-[#1f1f1f]">
                    <Link href={group.href} className="hover:underline">
                      {group.title}
                    </Link>
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {group.links.map((item) => (
                      <li key={item.id}>
                        <Link href={item.href} className={linkClass}>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#1F1F1F] ">
        <div className="container py-12">
          <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {companyGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-[15px] font-bold">{group.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-[13px] text-white/80 transition-colors hover:underline"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/20">
          <div className="container flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="inline-flex">
                <Image
                  src="/new-logo.png"
                  alt="Upskill Logo"
                  width={120}
                  height={40}
                  className="w-auto min-w-[110px] brightness-0 invert"
                />
              </Link>
              <p className="text-xs text-white/80">
                © {new Date().getFullYear()} Upskill Learning. All rights
                reserved.
              </p>
            </div>
            <Link
              href="/privacy-policy"
              className="text-[13px] text-white/80 transition-colors hover:underline"
            >
              Cookie settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
