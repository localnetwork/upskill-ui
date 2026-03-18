import CourseCard from "@/components/entities/course/CourseCard";
import BaseApi from "@/lib/api/_base.api";
import { useEffect, useState } from "react";
import FeaturedCourses from "../entities/course/FeaturedCourses";
import FeaturedCategories from "../entities/categories/FeaturedCategories";

export default function FeaturedTabs() {
  const [currentTab, setCurrentTab] = useState("trending");

  const tabs = [
    { id: "trending", label: "Trending Courses" },
    { id: "categories", label: "Explore Categories" },
    { id: "degrees", label: "Degrees" },
  ];

  const onClickTab = (tabId) => {
    setCurrentTab(tabId);
  };

  return (
    <div className="py-[80px]">
      <div className="container">
        <h2 className="text-4xl font-bold font-secondary text-slate-900 mb-8">
          Start Learning Today
        </h2>
        <div className="flex mb-6 gap-8 border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onClickTab(tab.id)}
              className={`${currentTab === tab.id ? "!border-[#0052cc] text-primary" : ""} cursor-pointer text-lg font-bold text-slate-600 hover:text-primary transition-colors pb-2 border-b-2 border-transparent hover:border-primary`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {currentTab === "trending" && <FeaturedCourses />}

        {currentTab === "categories" && <FeaturedCategories />}
      </div>
    </div>
  );
}
