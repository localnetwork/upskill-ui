import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, TrendingUp } from "lucide-react";
import BaseApi from "@/lib/api/_base.api";

const formatLearners = (count) =>
  `${new Intl.NumberFormat("en-US").format(Number(count || 0))} learner${
    Number(count) === 1 ? "" : "s"
  }`;

const byPopularity = (a, b) =>
  (b.learners_count || 0) - (a.learners_count || 0) ||
  (b.courses_count || 0) - (a.courses_count || 0) ||
  String(a.name || a.title).localeCompare(String(b.name || b.title));

export default function PopularSkillsByCategorySection() {
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

  const { featured, columns } = useMemo(() => {
    const columns = [...categories]
      .filter((c) => (c.children || []).length)
      .sort(byPopularity)
      .slice(0, 3)
      .map((c) => ({
        ...c,
        skills: [...c.children].sort(byPopularity).slice(0, 3),
      }));
    const all = categories.flatMap((c) => c.children || []);
    const featured = [...all].sort(byPopularity)[0] || null;
    return { featured, columns };
  }, [categories]);

  if (!columns.length) return null;

  return (
    <section className="bg-slate-50 py-10 md:py-14">
      <div className="container">
        <h2 className="border-b border-slate-200 pb-4 text-2xl font-bold text-slate-900 sm:text-3xl">
          Popular Skills
        </h2>

        <div className="grid gap-10 pt-8 md:grid-cols-2 lg:grid-cols-[1.2fr_repeat(3,1fr)]">
          {featured && (
            <div className="md:col-span-2 lg:col-span-1">
              <h3 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                {featured.name || featured.title} is a top skill
              </h3>
              <Link
                href={`/categories/${featured.slug}`}
                className="mt-5 inline-flex items-center gap-1 text-lg font-bold text-primary hover:underline"
              >
                See {featured.name || featured.title} courses
                <ChevronRight size={18} />
              </Link>
              <p className="mt-1 text-sm text-slate-500">
                {formatLearners(featured.learners_count)}
              </p>
              <Link
                href="/courses"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:!text-white sm:max-w-xs"
              >
                Show all trending skills
                <TrendingUp size={16} />
              </Link>
            </div>
          )}

          {columns.map((column) => (
            <div key={column.id} className="min-w-0">
              <h3 className="text-xl font-bold text-slate-900">
                {column.name || column.title}
              </h3>
              <ul className="mt-5 space-y-5">
                {column.skills.map((skill) => (
                  <li key={skill.id}>
                    <Link
                      href={`/categories/${skill.slug}`}
                      className="inline-flex items-center gap-1 text-lg font-bold text-primary hover:underline"
                    >
                      <span>{skill.name || skill.title}</span>
                      <ChevronRight size={16} className="shrink-0" />
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatLearners(skill.learners_count)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
