import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const ROWS = 2;
const COLUMNS = 5;
const PAGE_SIZE = ROWS * COLUMNS;

function chunk(items, size) {
  const pages = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

export default function TopicsCarousel({ title, topics = [] }) {
  const [page, setPage] = useState(0);
  const pages = useMemo(() => chunk(topics, PAGE_SIZE), [topics]);

  if (!pages.length) return null;

  const lastPage = pages.length - 1;
  const hasMultiplePages = pages.length > 1;

  return (
    <section className="py-12">
      <div className="container">
        <div className="flex items-center justify-between gap-4 mb-8">
          <h2 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight text-on-surface">
            {title}
          </h2>
          {hasMultiplePages ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                aria-label="Previous topics"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0}
                className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container disabled:opacity-30 transition"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Next topics"
                onClick={() => setPage((prev) => Math.min(lastPage, prev + 1))}
                disabled={page === lastPage}
                className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container disabled:opacity-30 transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${page * 100}%)` }}
          >
            {pages.map((pageItems, pageIndex) => (
              <div
                key={`topics-page-${pageIndex}`}
                className="w-full flex-shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 content-start"
                aria-hidden={pageIndex !== page}
              >
                {pageItems.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/topics/${topic.slug}`}
                    tabIndex={pageIndex === page ? 0 : -1}
                    className="group flex flex-col justify-center min-h-[84px] px-5 py-4 rounded-xl border border-outline-variant/60 bg-white hover:border-primary hover:shadow-md transition"
                  >
                    <span className="font-bold text-on-surface group-hover:text-primary line-clamp-2">
                      {topic.title || topic.name}
                    </span>
                    {typeof topic.course_count === "number" ? (
                      <span className="mt-1 text-xs font-semibold text-secondary/70">
                        {topic.course_count.toLocaleString("en-PH")}{" "}
                        {topic.course_count === 1 ? "course" : "courses"}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        {hasMultiplePages ? (
          <div className="mt-6 flex justify-center gap-2">
            {pages.map((_, pageIndex) => (
              <button
                key={`topics-dot-${pageIndex}`}
                type="button"
                aria-label={`Go to page ${pageIndex + 1}`}
                onClick={() => setPage(pageIndex)}
                className={`h-2 rounded-full transition-all ${
                  pageIndex === page
                    ? "w-6 bg-primary"
                    : "w-2 bg-outline-variant"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
