import PopularEducators from "@/components/entities/categories/show/PopularEducators";
import BaseApi from "@/lib/api/_base.api";

export async function getServerSideProps(context) {
  const segments = Array.isArray(context.params.id)
    ? context.params.id
    : [context.params.id];
  const id = segments[segments.length - 1];
  try {
    const response = await BaseApi.get(
      process.env.NEXT_PUBLIC_API_URL + `/categories/${id}`,
    );

    return {
      props: {
        category: response.data,
      },
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { notFound: true };
  }
}

export default function Page({ category }) {
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
                  1,248
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-secondary/70">
                  Expert Courses
                </span>
              </div>
              <div className="h-10 w-px bg-outline-variant"></div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-on-surface font-headline">
                  850k+
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-secondary/70">
                  Enrolled
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PopularEducators category={category} />
    </>
  );
}
