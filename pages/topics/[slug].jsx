import PopularEducators from "@/components/entities/categories/show/PopularEducators";
import FeaturedCourse from "@/components/entities/categories/show/FeaturedCourse";
import TopicCourses from "@/components/entities/categories/show/TopicCourses";
import TopicsCarousel from "@/components/entities/categories/show/TopicsCarousel";
import BaseApi from "@/lib/api/_base.api";

function asNumber(value) {
  return Number(value || 0);
}

export async function getServerSideProps(context) {
  const rawSlug = context?.params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  try {
    const response = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/tags/${encodeURIComponent(slug)}`,
    );

    const topic = response?.data || null;
    let relatedTopics = [];
    const categoryId = topic?.category_id || topic?.categoryId;
    if (categoryId) {
      try {
        const related = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/tags`,
          { params: { categoryId, limit: 100 } },
        );
        relatedTopics = (related?.data?.data || [])
          .filter((item) => item.id !== topic.id)
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
    }

    return {
      props: {
        topic,
        relatedTopics,
      },
    };
  } catch (_error) {
    return { notFound: true };
  }
}

export default function TopicPage({ topic, relatedTopics = [] }) {
  const expertCourses = asNumber(topic?.expert_courses);
  const totalEnrolled = asNumber(topic?.total_enrolled);

  return (
    <>
      <section className="py-16 md:py-20 bg-[#F8FAFC]">
        <div className="container">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-headline font-extrabold tracking-tighter text-on-surface mb-6">
              {topic?.title}
            </h1>
            <p className="text-on-surface-variant text-xl md:text-2xl leading-relaxed font-medium">
              {topic?.description ||
                "Accelerate your career in technology. Master real-world skills with practical, project-based learning."}
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

      <TopicsCarousel
        title={`${topic?.title} students also learn`}
        topics={relatedTopics}
      />

      <FeaturedCourse topicSlug={topic?.slug} />

      <TopicCourses topic={topic} />

      <PopularEducators category={topic} />
    </>
  );
}
