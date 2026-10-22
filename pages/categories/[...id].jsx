import FeaturedCourse from "@/components/entities/categories/show/FeaturedCourse";
import PopularEducators from "@/components/entities/categories/show/PopularEducators";
import TopicsCarousel from "@/components/entities/categories/show/TopicsCarousel";
import BaseApi from "@/lib/api/_base.api";

function asNumber(value) {
  return Number(value || 0);
}

export async function getServerSideProps(context) {
  const segments = Array.isArray(context.params.id)
    ? context.params.id
    : [context.params.id];
  const id = segments[segments.length - 1];
  try {
    const response = await BaseApi.get(
      process.env.NEXT_PUBLIC_API_URL + `/categories/${id}`,
    );

    let topics = [];
    try {
      const topicsResponse = await BaseApi.get(
        process.env.NEXT_PUBLIC_API_URL + "/tags",
        { params: { categoryId: response.data?.id, limit: 100 } },
      );
      topics = (topicsResponse?.data?.data || [])
        .sort(
          (a, b) => Number(b.course_count || 0) - Number(a.course_count || 0),
        )
        .map((item) => ({
          id: item.id,
          slug: item.slug,
          title: item.title || item.name,
          course_count: Number(item.course_count || 0),
        }));
    } catch (_error) {}

    return {
      props: {
        category: response.data,
        topics,
      },
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { notFound: true };
  }
}

export default function Page({ category, topics = [] }) {
  const expertCourses = asNumber(category?.expert_courses);
  const totalEnrolled = asNumber(category?.total_enrolled);

  return (
    <>
      <section className="py-16 md:py-20 bg-[#F8FAFC]">
        <div className="container">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-headline font-extrabold tracking-tighter text-on-surface mb-6">
              {category.title}
            </h1>
            <p className="text-on-surface-variant text-xl md:text-2xl leading-relaxed font-medium">
              Accelerate your career in technology. Master the engineering
              standards used by world-class software teams—from foundational
              architecture to large-scale distributed systems.
            </p>
            <div className="mt-8 flex items-center space-x-6">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-on-surface font-headline">
                  {expertCourses.toLocaleString("en-PH")}
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-secondary/70">
                  Expert Courses
                </span>
              </div>
              <div className="h-10 w-px bg-outline-variant"></div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-on-surface font-headline">
                  {totalEnrolled.toLocaleString("en-PH")}
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-secondary/70">
                  Enrolled
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FeaturedCourse categorySlug={category?.slug} />

      <TopicsCarousel title="Popular topics" topics={topics} />

      <PopularEducators category={category} />
    </>
  );
}
