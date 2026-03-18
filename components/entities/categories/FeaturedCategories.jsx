import BaseApi from "@/lib/api/_base.api";
import { useEffect, useState } from "react";

export default function FeaturedCategories() {
  const [categories, setCategories] = useState([]);
  const fetchCategories = async () => {
    try {
      const response = await BaseApi.get(
        process.env.NEXT_PUBLIC_API_URL + "/course-categories",
      );
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };
  useEffect(() => {
    fetchCategories();
  }, []);

  console.log("categories", categories);
  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <div class="category-card group relative h-64 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500">
            {/* <img alt="Web Development" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1hZfwFDXtz1YyLxu0XgUL3Zd3pyYaAGQmjiKZ9hkqqH7BQja6LsdvnH2ceBDCVfx8AgsZQuPZl4aBb4fPzJkOSesS19hraPYjhEpPNK8kHeRBbGUcQSJXHxeAjXx3COs0Zqqod5CtT81FJ3JDpJpdDHI0X652jUavpBiEKU2vzUk_xvIrijnCvl8TSWdQFlEokkvC942fGfxM4m3qcb2eKgMKNE2zDcVyIB2rm3v1-7mUmnEj_WrHeUk_BqwkUmgD12Gth936UtR1"> */}
            <div class="category-overlay absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent transition-colors duration-500"></div>
            <div class="absolute inset-0 p-6 flex flex-col justify-end">
              <h3 class="text-white text-xl font-bold mb-1">
                {category.title}
              </h3>
              <p class="text-blue-100/80 text-sm font-medium">1,200+ courses</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
