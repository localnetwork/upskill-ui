import BaseApi from "@/lib/api/_base.api";
import CertificateCard from "@/components/entities/certificate/CertificateCard";
import { useEffect, useState } from "react";
import ProfileCourseCarousel from "./ProfileCourseCarousel";
import { useProfileEdit } from "./inlineEdit";

export function LearnerSections({ profile }) {
  const completed = Array.isArray(profile?.completed_courses)
    ? profile.completed_courses
    : [];
  const certifications = Array.isArray(profile?.certifications)
    ? profile.certifications
    : [];

  return (
    <div className="container space-y-14 px-4 py-[60px] sm:px-8">
      <ProfileCourseCarousel
        title="Learnings"
        emptyText="No completed courses yet."
        items={completed.map((entry) => ({
          key: entry.enrollment_id,
          href: `/courses/${entry.course_slug}`,
          image: entry.cover_image?.path,
          title: entry.course_title,
          authors: entry.instructor_name,
          rating: null,
          ratings: entry.reviews_count,
        }))}
      />

      <section>
        <h2 className="mb-4 text-[28px] font-bold text-[#1f1f2e]">
          Certifications
        </h2>
        {certifications.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {certifications.map((certification) => (
              <CertificateCard
                key={certification.slug}
                certification={certification}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No certifications yet.</p>
        )}
      </section>
    </div>
  );
}

function formatStat(item) {
  if (item.format === "currency") {
    return `₱${Number(item.value || 0).toLocaleString("en-PH", {
      maximumFractionDigits: 2,
    })}`;
  }
  return Number(item.value || 0).toLocaleString("en-US");
}

// Platform figures are only loaded for the signed-in owner of the profile.
export function StaffStats() {
  const { canEdit } = useProfileEdit();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!canEdit) return;
    let cancelled = false;
    BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/profile/staff-stats`)
      .then((response) => {
        if (!cancelled) setItems(response?.data?.data?.items || []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [canEdit]);

  if (!canEdit || !items.length) return null;

  return (
    <div className="container px-4 py-[40px] sm:px-8">
      <h2 className="mb-4 text-[28px] font-bold text-[#1f1f2e]">Statistics</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="rounded-xl border border-blue-100 bg-white p-5"
          >
            <div className="text-[26px] font-bold leading-none tracking-tight text-gray-900">
              {formatStat(item)}
            </div>
            <div className="mt-2 text-[13px] font-medium text-gray-500">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
