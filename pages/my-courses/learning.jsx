import MyCoursesLayout from "@/components/partials/MyCoursesLayout";
import BaseApi from "@/lib/api/_base.api";
import ORDERAPI from "@/lib/api/orders/request";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Play, PlayCircle, PlayIcon } from "lucide-react";
export default function Page() {
  const [items, setItems] = useState([]);
  const router = useRouter();
  useEffect(() => {
    async function fetchLearnings() {
      try {
        const response = await ORDERAPI.myLearnings();
        console.log("Learnings:", response.data);
        setItems(response.data.data);
      } catch (error) {
        console.error("Error fetching learnings:", error);
      }
    }

    fetchLearnings();
  }, []);

  return (
    <MyCoursesLayout title="My Learning">
      <div className="grid grid-cols-4 gap-[20px]">
        {items && items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="cursor-pointer relative group"
              onClick={() =>
                router.push(`/courses/${item.course.data.slug}/learn`)
              }
            >
              {item?.course?.data?.cover_image && (
                <div className="relative">
                  <Link
                    className="absolute p-[15px] group-hover:opacity-100 opacity-0 bg-[rgba(0,0,0,.5)] flex items-center justify-center bg-opacity-20 top-0 left-0 w-full h-full"
                    href={`/courses/${item.course.data.slug}/learn`}
                  >
                    <span className="p-3 bg-white rounded-full flex items-center justify-center group-hover:scale-100 scale-80 transition-all">
                      <Play size={30} className="text-black opacity-80" />
                    </span>
                  </Link>
                  <Image
                    src={
                      process.env.NEXT_PUBLIC_API_DOMAIN +
                      item.course.data.cover_image?.path
                    }
                    alt={item.course.data.title}
                    width={400}
                    height={200}
                    className="w-full h-[200px] object-cover mb-4"
                  />
                </div>
              )}

              <h3 className="font-semibold text-[18px]">
                {item.course.data.title}
              </h3>

              <p className="font-light text-[14px]">
                {item.course.data.author?.data?.firstname}{" "}
                {item.course.data.author?.data?.lastname}
              </p>

              <div className="mt-3 text-[14px] font-light">
                <div className="h-[2px] bg-[#ddd] w-full"></div>

                <div className="mt-1">Start Course</div>
              </div>
            </div>
          ))
        ) : (
          <p>No courses found.</p>
        )}
      </div>
    </MyCoursesLayout>
  );
}
