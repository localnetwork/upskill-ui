import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="container py-14 md:py-18">
        <div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="inline-flex">
              <Image
                src="/logo.png"
                alt="Upskill Logo"
                width={150}
                height={50}
                className="w-auto min-w-[150px] brightness-0 invert"
              />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
              Upskill helps learners build practical skills through curated
              courses, guided projects, and mentorship from experienced teams.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold tracking-wide text-white">Explore</h4>
            <ul className="mt-4 space-y-3 text-sm text-white/65">
              <li>
                <Link className="transition-colors hover:text-white" href="/courses">
                  Courses
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-white" href="/courses">
                  Categories
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-white" href="/my-courses/learning">
                  Learning dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold tracking-wide text-white">Company</h4>
            <ul className="mt-4 space-y-3 text-sm text-white/65">
              <li>
                <Link className="transition-colors hover:text-white" href="/about">
                  About
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-white" href="/contact-us">
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  className="transition-colors hover:text-white"
                  href="/register?mode=instructor"
                >
                  Teach on Upskill
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold tracking-wide text-white">Support</h4>
            <ul className="mt-4 space-y-3 text-sm text-white/65">
              <li>
                <Link className="transition-colors hover:text-white" href="/settings/security">
                  Account security
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-white" href="/notifications">
                  Notifications
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-white" href="/settings/activity-log">
                  Activity log
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 text-xs text-white/55 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Upskill Learning. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="transition-colors hover:text-white">
              Privacy
            </Link>
            <Link href="/contact-us" className="transition-colors hover:text-white">
              Terms
            </Link>
            <Link href="/contact-us" className="transition-colors hover:text-white">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
