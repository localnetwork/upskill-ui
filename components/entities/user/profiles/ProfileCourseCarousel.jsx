import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function ProfileCourseCard({ item }) {
  const hasRating = item.rating !== null && item.rating !== undefined;
  const hasRatings = Number(item.ratings) > 0;

  return (
    <Link
      href={item.href}
      className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-lg"
    >
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image}
          alt={item.title}
          className="aspect-[16/9] w-full rounded-xl object-cover"
        />
      ) : (
        <div className="aspect-[16/9] w-full rounded-xl bg-gradient-to-br from-[#2a2b3f] to-[#4f46e5]" />
      )}
      <h3 className="mt-5 text-[20px] font-semibold leading-snug text-[#1f1f2e]">
        {item.title}
      </h3>
      {item.authors && (
        <p className="mt-2 line-clamp-2 text-[14px] text-gray-500">
          {item.authors}
        </p>
      )}
      {(hasRating || hasRatings) && (
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5 text-[14px] text-gray-600">
          {hasRating && (
            <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1">
              <Star size={14} fill="#c2610c" className="text-[#c2610c]" />
              {Number(item.rating).toFixed(1)}
            </span>
          )}
          {hasRatings && (
            <span className="rounded-md border border-gray-200 px-2 py-1">
              {Number(item.ratings).toLocaleString("en-US")} ratings
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

export function ScrollCarousel({
  title,
  items,
  emptyText,
  renderItem,
  className = "",
}) {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [items, updateArrows]);

  const scroll = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  };

  const arrowClass =
    "flex h-10 w-10 items-center justify-center rounded-full border border-primary text-primary transition hover:bg-[#f1eefe] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <section className={className}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-[28px] font-bold text-[#1f1f2e]">{title}</h2>
        {items.length > 0 && (
          <div className="flex gap-3">
            <button
              type="button"
              aria-label="Previous"
              disabled={!canPrev}
              onClick={() => scroll(-1)}
              className={arrowClass}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Next"
              disabled={!canNext}
              onClick={() => scroll(1)}
              className={arrowClass}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
      {items.length > 0 ? (
        <div
          ref={trackRef}
          onScroll={updateArrows}
          className="flex snap-x gap-5 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => (
            <div
              key={item.key}
              className="w-[280px] shrink-0 snap-start sm:w-[320px] xl:w-[calc((100%-60px)/4)]"
            >
              {renderItem(item)}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">{emptyText}</p>
      )}
    </section>
  );
}

export default function ProfileCourseCarousel({ title, items, emptyText }) {
  return (
    <ScrollCarousel
      title={title}
      items={items}
      emptyText={emptyText}
      renderItem={(item) => <ProfileCourseCard item={item} />}
    />
  );
}
