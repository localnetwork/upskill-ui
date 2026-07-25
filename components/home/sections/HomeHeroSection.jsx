import Image from "next/image";
import Link from "next/link";

export default function HomeHeroSection() {
  return (
    <section className="container pt-10">
      <div className="flex w-full overflow-hidden rounded-2xl bg-[#1F1F1F]">
        {/* Content */}
        <div className="flex w-full flex-col justify-center px-8 py-20 text-white lg:w-[50%] lg:px-16 xl:px-20">
          <h1 className="font-primary text-4xl font-bold leading-tight lg:text-5xl">
            Build Skills.
            <br />
            Create Opportunities.
          </h1>

          <p className="mt-6 max-w-lg text-md leading-8 text-slate-300">
            Learn practical, industry-ready skills through expert-led courses,
            hands-on projects, and career-focused learning paths designed to
            help you grow with confidence.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/courses"
              className="rounded-lg bg-primary px-8 py-4 text-[14px] font-semibold text-white transition-all duration-300 hover:bg-primary/90"
            >
              Explore Courses
            </Link>

            <Link
              href="/about"
              className="rounded-lg border border-white/20 px-8 py-4 text-[14px] font-semibold text-white transition-all duration-300 hover:border-white hover:bg-white/10"
            >
              Learn More
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap gap-8 text-sm text-slate-400">
            <div>
              <p className="text-2xl font-bold text-white">100+</p>
              <p>Expert Courses</p>
            </div>

            <div>
              <p className="text-2xl font-bold text-white">Hands-on</p>
              <p>Real Projects</p>
            </div>

            <div>
              <p className="text-2xl font-bold text-white">Career</p>
              <p>Focused Learning</p>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative hidden lg:block lg:w-[50%]">
          <Image
            src="/banner.png"
            alt="Students learning online"
            fill
            priority
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
