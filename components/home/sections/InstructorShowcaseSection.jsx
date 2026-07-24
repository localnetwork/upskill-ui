import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, BadgeCheck } from "lucide-react";
import useSectionReveal from "@/components/home/useSectionReveal";

const INSTRUCTORS = [
  {
    name: "Maya Thompson",
    title: "Senior Frontend Engineer",
    company: "Shopify",
    image: "/cta-1.jpg",
  },
  {
    name: "Arjun Sethi",
    title: "AI Product Lead",
    company: "Notion",
    image: "/cta-2.jpg",
  },
  {
    name: "Lena Park",
    title: "Design Systems Architect",
    company: "Stripe",
    image: "/cta-3.jpg",
  },
];

export default function InstructorShowcaseSection() {
  const sectionRef = useRef(null);
  useSectionReveal(sectionRef, { stagger: 0.08 });

  return (
    <section
      id="instructor-showcase"
      ref={sectionRef}
      data-home-section=""
      className="bg-white py-18 md:py-22"
    >
      <div className="container">
        <div data-reveal="" className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              Learn from instructors shipping real products.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Our instructors teach from practical experience across engineering,
              product, and design teams.
            </p>
          </div>
          <Link
            href="/register?mode=instructor"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            Become an instructor
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {INSTRUCTORS.map((item) => (
            <article
              key={item.name}
              data-reveal=""
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative h-52 w-full">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="inline-flex items-center gap-1 rounded-full bg-[#e8f1ff] px-3 py-1 text-xs font-medium text-primary">
                  <BadgeCheck className="h-4 w-4" />
                  Verified instructor
                </div>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
                  {item.name}
                </h3>
                <p className="mt-2 text-sm font-medium text-slate-700">{item.title}</p>
                <p className="text-sm text-slate-500">{item.company}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
