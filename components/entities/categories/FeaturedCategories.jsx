import BaseApi from "@/lib/api/_base.api";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function FeaturedCategories() {
  const [categories, setCategories] = useState([]);
  const fetchCategories = async () => {
    try {
      const response = await BaseApi.get(
        process.env.NEXT_PUBLIC_API_URL + "/categories",
      );
      const rows = response?.data?.data || [];
      setCategories(
        rows.map((category) => ({
          ...category,
          title: category.name,
        })),
      );
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };
  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div>
      <div className="grid grid-cols-2 gap-6">
        {categories.map((category) => (
          <div className="category-card group relative h-64 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500">
            <Link
              href={`/categories/${category.slug}`}
              className="absolute inset-0 z-10 top-0 left-0 w-full h-full"
            />
            <Image
              alt="Web Development"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500"
              src="/cta-1.jpg"
              width={400}
              height={300}
            />
            <div className="category-overlay absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent transition-colors duration-500"></div>
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <h3 className="text-white text-xl font-bold mb-1">
                {category.title}
              </h3>
              <p className="text-blue-100/80 text-sm font-medium">
                1,200+ courses
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
