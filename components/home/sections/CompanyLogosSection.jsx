import { useRef } from "react";
import { Building2 } from "lucide-react";
import useSectionReveal from "@/components/home/useSectionReveal";

const companies = [
  { name: "Google", industry: "Technology" },
  { name: "Meta", industry: "Social Media" },
  { name: "Stripe", industry: "Payments" },
  { name: "Shopify", industry: "E-commerce" },
  { name: "Notion", industry: "Productivity" },
  { name: "Atlassian", industry: "Software" },
  { name: "Canva", industry: "Design" },
  { name: "IBM", industry: "Enterprise" },
];

export default function CompanyLogosSection() {
  const sectionRef = useRef(null);
  useSectionReveal(sectionRef, { stagger: 0.06 });

  return (
    <section
      id="company-logos"
      ref={sectionRef}
      data-home-section=""
      className="bg-white py-20 md:py-24"
    >
      <div className="container">
        <div data-reveal="" className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Trusted by over 800 hiring partners
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            Our learners work at leading companies worldwide
          </p>
        </div>
        <div
          data-reveal=""
          className="grid grid-cols-1 gap-6 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
        >
          {companies.map((company) => (
            <div
              key={company.name}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <Building2 className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{company.name}</p>
                <p className="text-xs text-slate-500">{company.industry}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
