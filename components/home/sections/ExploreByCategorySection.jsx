import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Camera,
  Code2,
  Dumbbell,
  FolderOpen,
  GraduationCap,
  Megaphone,
  Music,
  SwatchBook,
  Wallet,
} from "lucide-react";
import BaseApi from "@/lib/api/_base.api";

// Keep in sync with the icon options in AdminCategoriesManagement.
const ICONS = {
  Code2,
  BriefcaseBusiness,
  Wallet,
  SwatchBook,
  Megaphone,
  Dumbbell,
  Camera,
  Music,
  GraduationCap,
  FolderOpen,
};

const DEFAULT_COLOR = "#334155";

const isHex = (value) => /^#([0-9a-f]{6})$/i.test(String(value || ""));

const formatCount = (count) =>
  `${new Intl.NumberFormat("en-US").format(Number(count || 0))} course${
    Number(count) === 1 ? "" : "s"
  }`;

export default function ExploreByCategorySection() {
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

  if (!categories.length) return null;

  return (
    <section className="py-10">
      <div className="container">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900">
            Explore by category
          </h2>
          <Link
            href="/courses"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all categories &rarr;
          </Link>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 lg:grid-cols-8 sm:overflow-visible">
          {categories.map((category) => {
            const Icon = ICONS[category.icon] || FolderOpen;
            const color = isHex(category.color)
              ? category.color
              : DEFAULT_COLOR;
            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group flex min-w-[110px] flex-col items-center text-center"
              >
                <span
                  className="flex h-16 w-16 items-center justify-center rounded-2xl transition-transform group-hover:-translate-y-1"
                  style={{ backgroundColor: `${color}1f`, color }}
                >
                  <Icon size={28} />
                </span>
                <span className="mt-3 text-sm font-semibold text-slate-900">
                  {category.name || category.title}
                </span>
                <span className="mt-0.5 text-xs text-slate-500">
                  {formatCount(category.courses_count)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
