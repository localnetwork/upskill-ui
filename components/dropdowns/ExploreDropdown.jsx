"use client";
import { useState, useRef } from "react";
import categories from "@/lib/preBuildScripts/static/categories.json";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ExploreDropdown() {
  const [activeIndex, setActiveIndex] = useState(null);
  const containerRef = useRef(null);

  const activeCategory = activeIndex !== null ? categories[activeIndex] : null;

  const getPanelTop = () => {
    if (!containerRef.current || activeIndex === null) return 0;
    const items = containerRef.current.querySelectorAll("[data-item]");
    const containerRect = containerRef.current.getBoundingClientRect();
    const itemRect = items[activeIndex]?.getBoundingClientRect();
    if (!itemRect) return 0;
    return itemRect.top - containerRect.top;
  };

  return (
    <div className="absolute group-hover:visible invisible left-0 top-0 pt-[46px]">
      {/* Shared positioned wrapper */}
      <div className="relative flex">
        {/* Parent list */}
        <div
          ref={containerRef}
          className="flex flex-col text-[14px] font-light z-10 shadow-md min-w-[220px] border border-gray-100 rounded-sm bg-white"
        >
          {categories.map((item, index) => (
            <Link
              key={index}
              href={"/categories/" + item.slug}
              data-item
              className={`flex items-center justify-between p-[13px_15px] cursor-pointer whitespace-nowrap transition-colors ${
                activeIndex === index ? "bg-gray-100" : "hover:bg-gray-100"
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <span>{item.title}</span>
              {item?.children?.length > 0 && (
                <ChevronRight className="ml-2 text-gray-400" size={14} />
              )}
            </Link>
          ))}
        </div>

        {/* Children panel */}
        {activeCategory?.children?.length > 0 && (
          <div
            className="absolute left-full h-full z-20 shadow-md min-w-[240px] border border-gray-100 rounded-sm bg-white overflow-y-auto"
            onMouseEnter={() => setActiveIndex(activeIndex)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {activeCategory.children.map((child, idx) => (
              <Link
                key={idx}
                href={"/categories/" + child.slug}
                className="flex items-center justify-between hover:bg-gray-100 p-[13px_15px] cursor-pointer whitespace-nowrap text-[14px] font-light"
              >
                {child.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
