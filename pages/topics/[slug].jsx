import PopularEducators from "@/components/entities/categories/show/PopularEducators";
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

    return {
      props: {
        topic: response?.data || null,
      },
    };
  } catch (_error) {
    return { notFound: true };
  }
}

export default function TopicPage({ topic }) {
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

      <PopularEducators category={topic} />
    </>
  );
}
