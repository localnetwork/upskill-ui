import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import useSectionReveal from "@/components/home/useSectionReveal";

const certifications = [
  {
    name: "CompTIA A+",
    slug: "comptia-a-plus",
    badgeLabel: "A+",
    badgeColor: "bg-rose-100 text-rose-600",
    courses: 12,
    description:
      "Foundation-level IT certification covering hardware, networking, and troubleshooting.",
  },
  {
    name: "AWS Cloud Practitioner",
    slug: "aws-cloud-practitioner",
    badgeLabel: "AWS",
    badgeColor: "bg-amber-100 text-amber-600",
    courses: 18,
    description:
      "Entry-level AWS certification validating cloud knowledge and best practices.",
  },
  {
    name: "PMP",
    slug: "pmp",
    badgeLabel: "PMP",
    badgeColor: "bg-blue-100 text-blue-600",
    courses: 8,
    description:
      "Globally recognized project management certification for experienced leaders.",
  },
  {
    name: "Google Data Analytics",
    slug: "google-data-analytics",
    badgeLabel: "GDA",
    badgeColor: "bg-emerald-100 text-emerald-600",
    courses: 15,
    description:
      "Hands-on data analytics certification covering SQL, spreadsheets, and Tableau.",
  },
  {
    name: "Azure Fundamentals",
    slug: "azure-fundamentals",
    badgeLabel: "AZ",
    badgeColor: "bg-sky-100 text-sky-600",
    courses: 14,
    description:
      "Microsoft Azure certification covering cloud concepts, core services, and pricing.",
  },
  {
    name: "Cisco CCNA",
    slug: "cisco-ccna",
    badgeLabel: "CCNA",
    badgeColor: "bg-indigo-100 text-indigo-600",
    courses: 10,
    description:
      "Associate-level networking certification covering IP connectivity and security.",
  },
];

export default function CertificationPrepSection() {
  const sectionRef = useRef(null);
  useSectionReveal(sectionRef, { stagger: 0.08 });

  return (
    <section
      id="certification-prep"
      ref={sectionRef}
      data-home-section=""
      className="bg-slate-50 py-20 md:py-24"
    >
      <div className="container">
        <div data-reveal="" className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Prepare for industry-recognized certifications
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            Comprehensive prep paths with practice exams and expert-led courses
          </p>
        </div>
        <div
          data-reveal=""
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {certifications.map((cert) => (
            <Link
              key={cert.slug}
              href={`/certifications/${cert.slug}`}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${cert.badgeColor}`}
                >
                  {cert.badgeLabel}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">
                    {cert.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                    {cert.description}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  {cert.courses} courses
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors duration-300 group-hover:text-primary/80">
                  Start path
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
