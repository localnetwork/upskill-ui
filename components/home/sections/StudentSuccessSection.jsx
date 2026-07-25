import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, ArrowRight } from "lucide-react";
import useSectionReveal from "@/components/home/useSectionReveal";

const testimonials = [
  {
    name: "Angela Rivera",
    role: "Frontend Engineer at Stripe",
    rating: 5.0,
    photo: "https://picsum.photos/seed/angela-rivera/96/96",
    quote:
      "The project-based curriculum gave me real confidence. I built portfolio pieces that directly helped me land my first tech role.",
    course: "Frontend Development Bootcamp",
    courseLink: "/courses/frontend-bootcamp",
  },
  {
    name: "Noah Patel",
    role: "Data Analyst at Canva",
    rating: 5.0,
    photo: "https://picsum.photos/seed/noah-patel/96/96",
    quote:
      "I switched careers from finance to data analytics in just five months. The mentor support was incredibly helpful throughout the journey.",
    course: "Data Analytics Pro Track",
    courseLink: "/courses/data-analytics-track",
  },
  {
    name: "Mina Okafor",
    role: "Product Designer at Atlassian",
    rating: 5.0,
    photo: "https://picsum.photos/seed/mina-okafor/96/96",
    quote:
      "This platform helped me develop a design thinking mindset, not just tool skills. My portfolio stood out because of the real-world cases.",
    course: "UX & Product Design Program",
    courseLink: "/courses/ux-product-design",
  },
  {
    name: "James Chen",
    role: "ML Engineer at Google",
    rating: 5.0,
    photo: "https://picsum.photos/seed/james-chen/96/96",
    quote:
      "The structured ML track covered everything from fundamentals to deployment. The certification prep was the icing on the cake.",
    course: "Machine Learning Engineer Path",
    courseLink: "/courses/ml-engineer-path",
  },
  {
    name: "Sarah Williams",
    role: "UX Lead at Meta",
    rating: 5.0,
    photo: "https://picsum.photos/seed/sarah-williams/96/96",
    quote:
      "I appreciated how the curriculum mirrored real agency workflows. It prepared me for the pace and quality expectations at top tech companies.",
    course: "Advanced UX Leadership",
    courseLink: "/courses/advanced-ux-leadership",
  },
  {
    name: "David Okonkwo",
    role: "DevOps Engineer at AWS",
    rating: 4.9,
    photo: "https://picsum.photos/seed/david-okonkwo/96/96",
    quote:
      "The hands-on labs and real infrastructure projects were game-changers. I went from IT support to cloud engineer in under a year.",
    course: "DevOps & Cloud Infrastructure",
    courseLink: "/courses/devops-cloud-infra",
  },
];

export default function StudentSuccessSection() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  useSectionReveal(sectionRef, { stagger: 0.1 });

  const scrollToCard = useCallback((index) => {
    if (!trackRef.current) return;
    const cards = trackRef.current.querySelectorAll("[data-testimonial-card]");
    if (cards[index]) {
      cards[index].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  }, []);

  const scrollByCard = useCallback((direction) => {
    if (!trackRef.current) return;
    const cards = trackRef.current.querySelectorAll("[data-testimonial-card]");
    const currentCard = cards[activeIndex];
    if (!currentCard) return;

    const targetIndex = Math.max(
      0,
      Math.min(cards.length - 1, activeIndex + direction),
    );
    cards[targetIndex].scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
    setActiveIndex(targetIndex);
  }, [activeIndex]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.index);
            if (!isNaN(index)) {
              setActiveIndex(index);
            }
          }
        }
      },
      {
        root: track,
        rootMargin: "-20% 0px -20% 0px",
        threshold: 0.5,
      },
    );

    const cards = track.querySelectorAll("[data-testimonial-card]");
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const sectionObserver = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.3 },
    );

    sectionObserver.observe(section);
    return () => sectionObserver.disconnect();
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (!isVisible) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollByCard(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollByCard(1);
      }
    },
    [isVisible, scrollByCard],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <section
      id="student-success"
      ref={sectionRef}
      data-home-section=""
      className="overflow-hidden bg-slate-50 py-20 md:py-24"
    >
      <div className="container">
        <div data-reveal="" className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Learners who changed careers with confidence.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            Hear from graduates who transformed their professional lives through
            our programs.
          </p>
        </div>
      </div>

      <div data-reveal="" className="relative">
        {/* Left Arrow */}
        <button
          onClick={() => scrollByCard(-1)}
          className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2.5 shadow-lg transition-all duration-300 hover:bg-slate-50 hover:shadow-xl md:flex"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-5 w-5 text-slate-700" />
        </button>

        {/* Scroll Track */}
        <div
          ref={trackRef}
          data-scroll-track="true"
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-6 scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <style>{`
            div[data-scroll-track="true"]::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="ml-[--scroll-padding,calc((100vw-var(--container-max,1280px))/2+1rem)] shrink-0 w-0" />
          {testimonials.map((item, index) => (
            <div
              key={item.name}
              data-testimonial-card=""
              data-index={index}
              className="w-[85vw] snap-start shrink-0 sm:w-[70vw] md:w-[45vw] lg:w-[380px]"
            >
              <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={item.photo}
                    alt={item.name}
                    className="h-12 w-12 rounded-full border-2 border-slate-200 object-cover"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500">{item.role}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < Math.floor(item.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-200 text-slate-200"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-xs font-semibold text-slate-700">
                    {item.rating}
                  </span>
                </div>

                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>

                <Link
                  href={item.courseLink}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                >
                  {item.course}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
          <div className="mr-[--scroll-padding,calc((100vw-var(--container-max,1280px))/2+1rem)] shrink-0 w-0" />
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scrollByCard(1)}
          className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2.5 shadow-lg transition-all duration-300 hover:bg-slate-50 hover:shadow-xl md:flex"
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-5 w-5 text-slate-700" />
        </button>
      </div>

      {/* Dot Indicators */}
      <div data-reveal="" className="mt-6 flex items-center justify-center gap-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToCard(index)}
            className={`rounded-full transition-all duration-300 ${
              index === activeIndex
                ? "h-2.5 w-2.5 bg-primary"
                : "h-2 w-2 bg-slate-300 hover:bg-slate-400"
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
