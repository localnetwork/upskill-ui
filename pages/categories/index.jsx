import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Seo from "@/components/partials/Seo";
import HeaderSearchAutocomplete from "@/components/partials/HeaderSearchAutocomplete";
import categories from "@/lib/preBuildScripts/static/categories.json";

export default function CategoriesIndex() {
  return (
    <>
      <Seo
        title="Explore Categories"
        description="Browse all course categories on Upskill."
      />
      <div className="container py-6">
        <h1 className="mb-4 text-2xl font-bold text-slate-800">Explore</h1>
        <div className="mb-6 md:hidden">
          <HeaderSearchAutocomplete className="w-full" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <section
              key={category.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <h2 className="mb-2 text-base font-bold text-slate-800">
                {category.title}
              </h2>
              <ul>
                {(category.children || []).map((child) => (
                  <li key={child.id || child.slug}>
                    <Link
                      href={`/categories/${child.slug}`}
                      className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-gray-50"
                    >
                      {child.title}
                      <ChevronRight size={16} className="text-slate-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
