import Image from "next/image";
import Link from "next/link";

const search = (term) => `/courses?search=${encodeURIComponent(term)}`;

const skillGroups = [
  {
    title: "In-demand Careers",
    links: [
      "Data Scientist",
      "Full Stack Web Developer",
      "Cloud Engineer",
      "Project Manager",
      "Game Developer",
    ],
  },
  {
    title: "Web Development",
    links: ["Web Development", "JavaScript", "React JS", "Angular", "Java"],
  },
  {
    title: "IT Certifications",
    links: [
      "Amazon AWS",
      "AWS Certified Cloud Practitioner",
      "AZ-900: Microsoft Azure Fundamentals",
      "AWS Certified Solutions Architect - Associate",
      "Kubernetes",
    ],
  },
  {
    title: "Leadership",
    links: [
      "Leadership",
      "Management Skills",
      "Project Management",
      "Personal Productivity",
      "Emotional Intelligence",
    ],
  },
  {
    title: "Certifications by Skill",
    links: [
      "Cybersecurity Certification",
      "Project Management Certification",
      "Cloud Certification",
      "Data Analytics Certification",
      "HR Management Certification",
    ],
  },
  {
    title: "Data Science",
    links: [
      "Data Science",
      "Python",
      "Machine Learning",
      "ChatGPT",
      "Deep Learning",
    ],
  },
  {
    title: "Communication",
    links: [
      "Communication Skills",
      "Presentation Skills",
      "Public Speaking",
      "Writing",
      "PowerPoint",
    ],
  },
  {
    title: "Business Analytics & Intelligence",
    links: [
      "Microsoft Excel",
      "SQL",
      "Microsoft Power BI",
      "Data Analysis",
      "Business Analysis",
    ],
  },
];

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
  return (
    <footer className="text-white">
      <div className="border-t border-white/20 bg-[#F1F5F9]">
        <div className="container py-12">
          <h2 className="text-lg font-bold text-[#1f1f1f]">
            Explore top skills and certifications
          </h2>
          <div className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {skillGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-[15px] font-bold text-[#1f1f1f]">
                  {group.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((label) => (
                    <li key={label}>
                      <Link href={search(label)} className={linkClass}>
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

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
