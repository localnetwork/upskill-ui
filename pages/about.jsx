import Image from "next/image";
import Seo from "@/components/partials/Seo";

export default function About() {
  return (
    <>
      <Seo
        title="About Us"
        description="Learn about Upskill's mission to help people build in-demand skills through affordable, project-based online courses."
      />
      {/* Hero Section */}
      <section className="relative flex items-center overflow-hidden px-4 py-12 sm:px-6 sm:py-16 lg:min-h-[618px] lg:px-8 lg:py-20">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="relative z-10 lg:col-span-7">
            <h1 className="mb-6 text-4xl font-extrabold leading-[0.95] tracking-tighter text-on-surface sm:text-5xl md:text-6xl lg:mb-8 lg:text-7xl xl:text-8xl">
              Empowering the Next Generation of{" "}
              <span className="text-primary">Digital Curators</span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-secondary sm:text-lg lg:text-xl">
              Moving beyond traditional education. We are building a
              high-velocity environment where academic rigor meets modern tech
              industry speed.
            </p>
          </div>

          <div className="relative mt-2 lg:col-span-5 lg:mt-0">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl shadow-2xl">
              <Image
                alt="Digital Curators Team"
                className="object-cover"
                src="/about-1.png"
                fill
                priority
                sizes="(max-width: 1023px) 100vw, (max-width: 1279px) 42vw, 500px"
              />
            </div>

            <div className="absolute -bottom-4 left-4 rounded-lg bg-primary p-5 text-white shadow-xl sm:-bottom-5 sm:-left-5 sm:p-6 md:-bottom-6 md:left-6 md:p-8 lg:left-0 xl:-left-6">
              <span className="block text-3xl font-black sm:text-4xl">
                2024
              </span>
              <span className="text-xs uppercase tracking-widest opacity-80 sm:text-sm">
                Redefining Learning
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-surface-container-low px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28 xl:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
            <div>
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
                Our Mission
              </span>

              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Bridging the Gap Between Ivory Towers and High-Growth Industry.
              </h2>
            </div>

            <div className="space-y-5 sm:space-y-6">
              <p className="text-base leading-relaxed text-secondary sm:text-lg">
                Traditional education is too slow for the digital age. Industry
                training is often too shallow. Upskill sits at the intersection
                — providing the structural rigor of academic institutions with
                the bold, aggressive clarity of modern tech.
              </p>

              <p className="text-base leading-relaxed text-secondary sm:text-lg">
                We don&apos;t just teach skills; we curate the mindset required
                to navigate and lead in the ever-shifting digital landscape.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Evolution Section */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28 xl:py-32">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-10 text-3xl font-black tracking-tighter sm:mb-12 sm:text-4xl lg:mb-16">
            The Evolution of Upskill
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
            {/* Academic Roots */}
            <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:p-8 lg:col-span-2 lg:p-10">
              <div>
                <h3 className="mb-4 text-xl font-bold sm:text-2xl">
                  Academic Roots
                </h3>

                <p className="max-w-md leading-relaxed text-secondary">
                  Founded by a group of educators from top-tier research
                  universities, Upskill began as a project to digitize advanced
                  pedagogy for everyone.
                </p>
              </div>

              <div className="mt-8 border-t border-outline-variant/15 pt-6 sm:mt-10 sm:pt-8">
                <span className="font-bold text-primary">2018 — The Spark</span>
              </div>
            </div>

            {/* Brave Mission */}
            <div className="flex flex-col justify-between rounded-xl bg-primary p-6 text-white sm:p-8 lg:p-10">
              <div>
                <h3 className="mb-4 text-xl font-bold sm:text-2xl">
                  Brave Mission
                </h3>

                <p className="leading-relaxed opacity-80">
                  Infusing the platform with high-velocity product thinking.
                  Speed is a feature.
                </p>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6 sm:mt-10 sm:pt-8">
                <span className="font-bold">2021 — The Pivot</span>
              </div>
            </div>

            {/* Today */}
            <div className="rounded-xl bg-[#A93802] p-6 text-[#ffcebd] sm:p-8 md:col-span-3 lg:p-10">
              <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
                <div className="max-w-xl">
                  <h3 className="mb-4 text-2xl font-bold sm:text-3xl">
                    Today: The Curator Era
                  </h3>

                  <p className="text-base leading-relaxed opacity-90 sm:text-lg">
                    We are now the world&apos;s premier destination for those
                    who seek not just a certificate, but mastery and membership
                    in a global elite of digital practitioners.
                  </p>
                </div>

                <div className="flex shrink-0 -space-x-3 sm:-space-x-4">
                  <div className="h-12 w-12 rounded-full border-4 border-surface bg-surface-dim sm:h-16 sm:w-16" />
                  <div className="h-12 w-12 rounded-full border-4 border-surface bg-primary sm:h-16 sm:w-16" />
                  <div className="h-12 w-12 rounded-full border-4 border-surface bg-secondary sm:h-16 sm:w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-[#1C1B1B] px-4 py-16 text-[#DAE2FF] sm:px-6 sm:py-20 lg:px-8 lg:py-28 xl:py-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6 lg:gap-12">
          <div className="text-center sm:text-left">
            <span className="mb-2 block text-5xl font-black tracking-tighter text-primary-fixed sm:text-5xl md:text-6xl lg:text-7xl">
              10M+
            </span>
            <span className="text-xs uppercase tracking-widest text-surface-variant sm:text-sm">
              Learners Worldwide
            </span>
          </div>

          <div className="text-center sm:text-left">
            <span className="mb-2 block text-5xl font-black tracking-tighter text-primary-fixed sm:text-5xl md:text-6xl lg:text-7xl">
              190+
            </span>
            <span className="text-xs uppercase tracking-widest text-surface-variant sm:text-sm">
              Countries Reached
            </span>
          </div>

          <div className="text-center sm:text-left">
            <span className="mb-2 block text-5xl font-black tracking-tighter text-primary-fixed sm:text-5xl md:text-6xl lg:text-7xl">
              2,500+
            </span>
            <span className="text-xs uppercase tracking-widest text-surface-variant sm:text-sm">
              Expert Mentors
            </span>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="mb-10 px-4 py-12 sm:mb-16 sm:px-6 sm:py-16 lg:mb-20 lg:px-8 lg:py-24">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-xl bg-primary px-5 py-12 text-center sm:px-8 sm:py-16 md:px-12 md:py-20">
          <div className="relative z-10">
            <h2 className="mb-8 text-3xl font-black tracking-tighter text-white sm:text-4xl md:text-5xl lg:text-6xl">
              Ready to curate your future?
            </h2>

            <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
              <button
                type="button"
                className="w-full rounded-md bg-[#FCF9F8] px-6 py-3.5 text-base font-bold text-primary shadow-xl transition-colors hover:bg-surface-container-lowest sm:w-auto sm:px-8 sm:py-4 sm:text-lg lg:px-10"
              >
                Start Your Journey Today
              </button>

              <button
                type="button"
                className="w-full rounded-md border border-white/30 px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-white/10 sm:w-auto sm:px-8 sm:py-4 sm:text-lg lg:px-10"
              >
                View Careers
              </button>
            </div>
          </div>

          {/* Decorative Background Elements */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary-container opacity-50 blur-3xl sm:-right-24 sm:-top-24 sm:h-80 sm:w-80 lg:h-96 lg:w-96" />

          <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-tertiary opacity-20 blur-3xl sm:-bottom-24 sm:-left-24 sm:h-80 sm:w-80 lg:h-96 lg:w-96" />
        </div>
      </section>
    </>
  );
}
