import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import MyCoursesLayout from "@/components/partials/MyCoursesLayout";
import CertificateCard from "@/components/entities/certificate/CertificateCard";
import BaseApi from "@/lib/api/_base.api";

export default function Page() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingSlugs, setSavingSlugs] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/certifications/me`,
        );
        if (active) setItems(response?.data?.data || []);
      } catch (error) {
        toast.error(error?.data?.message || "Failed to load certificates");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const toggleProfile = async (slug, show) => {
    if (savingSlugs.includes(slug)) return;
    const previous = items;
    setSavingSlugs((prev) => [...prev, slug]);
    setItems((prev) =>
      prev.map((item) =>
        item.slug === slug ? { ...item, show_on_profile: show } : item,
      ),
    );

    try {
      await BaseApi.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/certifications/${slug}/visibility`,
        { show_on_profile: show },
      );
      toast.success(show ? "Shown on your profile" : "Hidden from your profile");
    } catch (error) {
      setItems(previous);
      toast.error(error?.data?.message || "Failed to update visibility");
    } finally {
      setSavingSlugs((prev) => prev.filter((id) => id !== slug));
    }
  };

  return (
    <MyCoursesLayout title="My Certificates">
      {isLoading ? (
        <p>Loading certificates...</p>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((certification) => (
            <CertificateCard
              key={certification.slug}
              certification={certification}
              footer={
                <div className="flex items-center justify-between gap-3 text-[13px] text-gray-700">
                  <span>Show on my profile</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={certification.show_on_profile}
                    aria-label="Show on my profile"
                    disabled={savingSlugs.includes(certification.slug)}
                    onClick={() =>
                      toggleProfile(
                        certification.slug,
                        !certification.show_on_profile,
                      )
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60 ${
                      certification.show_on_profile
                        ? "bg-[#0056D2]"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        certification.show_on_profile
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">
          No certificates yet. Complete a course to earn one.
        </p>
      )}
    </MyCoursesLayout>
  );
}
