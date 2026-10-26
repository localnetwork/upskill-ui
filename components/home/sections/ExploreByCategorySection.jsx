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
        <h2 className="mb-4 text-xl font-bold text-slate-900 sm:text-2xl">
          Explore categories
        </h2>

        <div className="flex flex-wrap gap-3">
          {categories.map((category) => {
            const Icon = ICONS[category.icon] || FolderOpen;
            const name = category.name || category.title;
            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                title={formatCount(category.courses_count)}
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-3 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-200 sm:text-base"
              >
                <Icon size={18} className="shrink-0" />
                <span>{name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
