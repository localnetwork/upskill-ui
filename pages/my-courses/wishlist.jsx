import MyCoursesLayout from "@/components/partials/MyCoursesLayout";
import WISHLISTAPI from "@/lib/api/wishlist/request";
import Image from "next/image";
import Link from "next/link";
import { Heart, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

export default function Page() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingCourseIds, setRemovingCourseIds] = useState([]);
  const router = useRouter();

  const fetchWishlist = async () => {
    try {
      setIsLoading(true);
      const response = await WISHLISTAPI.list();
      setItems(response?.data?.data || []);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load wishlist");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (courseId) => {
    if (removingCourseIds.includes(courseId)) return;
    const previousItems = items;
    setRemovingCourseIds((prev) => [...prev, courseId]);
    setItems((prev) => prev.filter((item) => item?.course?.id !== courseId));

    try {
      await WISHLISTAPI.remove(courseId);
      toast.success("Removed from wishlist");
    } catch (error) {
      setItems(previousItems);
      toast.error(error?.data?.message || "Failed to remove from wishlist");
    } finally {
      setRemovingCourseIds((prev) => prev.filter((id) => id !== courseId));
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  return (
    <MyCoursesLayout title="My Wishlist">
      {isLoading ? (
        <p>Loading wishlist...</p>
      ) : (
        <div className="grid grid-cols-4 gap-[20px]">
          {items?.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className="cursor-pointer relative group"
                onClick={() => router.push(`/courses/${item.course.slug}`)}
              >
                <div className="relative">
                  <Link
                    className="absolute p-[15px] group-hover:opacity-100 opacity-0 bg-[rgba(0,0,0,.5)] flex items-center justify-center bg-opacity-20 top-0 left-0 w-full h-full"
                    href={`/courses/${item.course.slug}`}
                  >
                    <span className="p-3 bg-white rounded-full flex items-center justify-center group-hover:scale-100 scale-80 transition-all">
                      <Play size={30} className="text-black opacity-80" />
                    </span>
                  </Link>
                  <button
                    disabled={removingCourseIds.includes(item.course.id)}
                    className="absolute right-2 top-2 w-9 h-9 z-20 bg-white/90 rounded-full flex items-center justify-center hover:bg-white"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(item.course.id);
                    }}
                  >
                    <Heart
                      size={18}
                      className="text-red-500"
                      fill="currentColor"
                    />
                  </button>
                  <Image
                    src={
                      item?.course?.cover_image?.path
                        ? item.course.cover_image.path
                        : "/placeholder-cover.webp"
                    }
                    alt={item.course.title}
                    width={400}
                    height={200}
                    className="w-full h-[200px] object-cover mb-4"
                  />
                </div>

                <h3 className="font-semibold text-[18px]">
                  {item.course.title}
                </h3>
                <p className="font-light text-[14px]">
                  {item.course.author?.data?.firstname}{" "}
                  {item.course.author?.data?.lastname}
                </p>
              </div>
            ))
          ) : (
            <p>No courses in wishlist.</p>
          )}
        </div>
      )}
    </MyCoursesLayout>
  );
}
