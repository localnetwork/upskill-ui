import BaseApi from "@/lib/api/_base.api";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import useSectionReveal from "@/components/home/useSectionReveal";

export default function FeaturedCategories() {
  const sectionRef = useRef(null);
  const [categories, setCategories] = useState([]);

  useSectionReveal(sectionRef, { stagger: 0.08 });

  const fetchCategories = async () => {
    try {
      const response = await BaseApi.get(
        process.env.NEXT_PUBLIC_API_URL + "/categories?tree=true",
      );
      const rows = response?.data?.data || [];
      setCategories(
        rows.map((category) => ({
          ...category,
          title: category.name || category.title,
        })),
      );
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };
  useEffect(() => {
    fetchCategories();
  }, []);

  if (!categories.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-slate-700">
        Categories are being updated. Please refresh in a moment.
      </div>
    );
  }

  return (
    <div ref={sectionRef}>
      <div className="grid gap-5 md:grid-cols-2">
        {categories.map((category) => (
          <article
            key={category.id || category.slug}
            data-reveal=""
            className="group relative h-64 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <Link
              href={`/categories/${category.slug}`}
              className="absolute inset-0 z-10 h-full w-full"
              aria-label={`Explore ${category.title} courses`}
            />
            <Image
              alt={category.title || "Course category"}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              src={`/cta-${((category.id || 1) % 3) + 1}.jpg`}
              width={900}
              height={600}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/55 to-slate-900/10" />
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <h3 className="mb-1 text-2xl font-semibold text-white">
                {category.title}
              </h3>
              <p className="text-sm font-medium text-blue-100/90">
                Discover curated learning tracks
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
