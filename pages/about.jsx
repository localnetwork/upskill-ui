import Image from "next/image";

export default function About() {
  return (
    <>
      <section class="relative min-h-[618px] flex items-center px-8 py-20 overflow-hidden">
        <div class="max-w-7xl mx-auto w-full grid grid-cols-12 gap-8">
          <div class="col-span-12 lg:col-span-7 z-10">
            <h1 class="font-headline text-6xl md:text-8xl font-extrabold tracking-tighter leading-[0.9] text-on-surface mb-8">
              Empowering the Next Generation of{" "}
              <span class="text-primary">Digital Curators</span>
            </h1>
            <p class="font-body text-xl text-secondary max-w-xl leading-relaxed">
              Moving beyond traditional education. We are building a
              high-velocity environment where academic rigor meets modern tech
              industry speed.
            </p>
          </div>
          <div class="col-span-12 lg:col-span-5 relative mt-12 lg:mt-0">
            <div class="aspect-square rounded-xl overflow-hidden shadow-2xl">
              <Image
                alt="Digital Curators Team"
                class="w-full h-full object-cover"
                data-alt="Modern collaborative workspace with young professionals working around a large screen showing vibrant data visualizations and code"
                src="/about-1.png"
                width={500}
                height={500}
              />
            </div>
            <div class="absolute -bottom-6 -left-6 bg-primary text-white p-8 rounded-lg shadow-xl hidden md:block">
              <span class="font-headline font-black text-4xl block">2024</span>
              <span class="font-label text-sm uppercase tracking-widest opacity-80">
                Redefining Learning
              </span>
            </div>
          </div>
        </div>
      </section>
      <section class="bg-surface-container-low py-32 px-8">
        <div class="max-w-7xl mx-auto">
          <div class="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span class="text-primary font-headline font-bold uppercase tracking-[0.2em] text-sm">
                Our Mission
              </span>
              <h2 class="font-headline text-5xl font-extrabold tracking-tight mt-4 mb-8">
                Bridging the Gap Between Ivory Towers and High-Growth Industry.
              </h2>
            </div>
            <div class="space-y-6">
              <p class="font-body text-lg text-secondary leading-relaxed">
                Traditional education is too slow for the digital age. Industry
                training is often too shallow. Upskill sits at the
                intersection—providing the structural rigor of academic
                institutions with the bold, aggressive clarity of modern tech.
              </p>
              <p class="font-body text-lg text-secondary leading-relaxed">
                We don't just teach skills; we curate the mindset required to
                navigate and lead in the ever-shifting digital landscape.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section class="py-32 px-8">
        <div class="max-w-7xl mx-auto">
          <h2 class="font-headline text-4xl font-black mb-16 tracking-tighter">
            The Evolution of Upskill
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-2 bg-surface-container-lowest p-10 rounded-xl shadow-sm flex flex-col justify-between">
              <div>
                {/* <span
                  class="material-symbols-outlined text-primary text-4xl mb-4"
                  data-icon="history_edu"
                >
                  history_edu
                </span> */}
                <h3 class="font-headline text-2xl font-bold mb-4">
                  Academic Roots
                </h3>
                <p class="text-secondary leading-relaxed max-w-md">
                  Founded by a group of educators from top-tier research
                  universities, Upskill began as a project to digitize advanced
                  pedagogy for everyone.
                </p>
              </div>
              <div class="mt-8 border-t border-outline-variant/15 pt-8">
                <span class="font-headline font-bold text-primary">
                  2018 — The Spark
                </span>
              </div>
            </div>
            <div class="bg-primary text-white p-10 rounded-xl text-on-primary flex flex-col justify-between">
              <h3 class="font-headline text-2xl font-bold mb-4">
                Brave Mission
              </h3>
              <p class="opacity-80 leading-relaxed">
                Infusing the platform with high-velocity product thinking. Speed
                is a feature.
              </p>
              <div class="mt-8 pt-8 border-t border-on-primary/10">
                <span class="font-headline font-bold">2021 — The Pivot</span>
              </div>
            </div>
            <div class="bg-[#A93802] text-[#ffcebd] p-10 rounded-xl md:col-span-3">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div class="max-w-xl">
                  <h3 class="font-headline text-3xl font-bold mb-4">
                    Today: The Curator Era
                  </h3>
                  <p class="opacity-90 leading-relaxed text-lg">
                    We are now the world's premier destination for those who
                    seek not just a certificate, but mastery and membership in a
                    global elite of digital practitioners.
                  </p>
                </div>
                <div class="flex -space-x-4">
                  <div class="w-16 h-16 rounded-full border-4 border-surface bg-surface-dim"></div>
                  <div class="w-16 h-16 rounded-full border-4 border-surface bg-primary"></div>
                  <div class="w-16 h-16 rounded-full border-4 border-surface bg-secondary"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section class="bg-[#1C1B1B] text-[#DAE2FF] py-32 px-8">
        <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-20">
          <div class="text-center md:text-left">
            <span class="font-headline text-7xl font-black text-primary-fixed block mb-2 tracking-tighter">
              10M+
            </span>
            <span class="font-label uppercase tracking-widest text-surface-variant text-sm">
              Learners Worldwide
            </span>
          </div>
          <div class="text-center md:text-left">
            <span class="font-headline text-7xl font-black text-primary-fixed block mb-2 tracking-tighter">
              190+
            </span>
            <span class="font-label uppercase tracking-widest text-surface-variant text-sm">
              Countries Reached
            </span>
          </div>
          <div class="text-center md:text-left">
            <span class="font-headline text-7xl font-black text-primary-fixed block mb-2 tracking-tighter">
              2,500+
            </span>
            <span class="font-label uppercase tracking-widest text-surface-variant text-sm">
              Expert Mentors
            </span>
          </div>
        </div>
      </section>
      <section class="py-24 px-8 mb-20">
        <div class="max-w-7xl mx-auto bg-primary rounded-xl p-12 md:p-20 text-center relative overflow-hidden">
          <div class="relative z-10">
            <h2 class="font-headline text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter">
              Ready to curate your future?
            </h2>
            <div class="flex flex-col md:flex-row items-center justify-center gap-4">
              <button class="bg-[#FCF9F8] text-primary font-headline font-bold px-10 py-4 rounded-md text-lg shadow-xl hover:bg-surface-container-lowest transition-colors">
                Start Your Journey Today
              </button>
              <button class="text-white border border-on-primary/30 text-on-primary font-headline font-bold px-10 py-4 rounded-md text-lg hover:bg-on-primary/10 transition-colors">
                View Careers
              </button>
            </div>
          </div>
          <div class="absolute -top-24 -right-24 w-96 h-96 bg-primary-container rounded-full opacity-50 blur-3xl"></div>
          <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-tertiary rounded-full opacity-20 blur-3xl"></div>
        </div>
      </section>
    </>
  );
}
