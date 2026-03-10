import Image from "next/image";
import Link from "next/link";
import persistentStore from "@/lib/store/persistentStore";
import { useMemo } from "react";
import { BadgeCheck } from "lucide-react";
export default function HomeBanner() {
  const profile = persistentStore((state) => state.profile);

  const isInstructor = useMemo(
    () => profile?.roles?.some((role) => role.role_name === "Instructor"),
    [profile],
  );

  const isLearner = useMemo(
    () => profile?.roles?.some((role) => role.role_name === "Learner"),
    [profile],
  );

  console.log("isInstructor:", isInstructor, "isLearner:", isLearner);
  return (
    <section>
      <div class="container pt-[50px] pb-[80px]">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div class="text-center lg:text-left">
            <div class="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              Level up your skills
            </div>
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
              Achieve your career goals with{" "}
              <span class="text-primary">Upskill Learning</span>
            </h1>
            <p class="text-lg text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0">
              Master in-demand technologies with courses designed by industry
              experts. Your future starts today.
            </p>
            <div class="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button class="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center">
                Get Started
              </button>
              <button class="w-full sm:w-auto bg-white border border-slate-200 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                View Pricing
              </button>
            </div>
          </div>
          <div class="relative flex justify-center lg:justify-end">
            <div class="relative w-full max-w-md aspect-square rounded-3xl shadow-2xl">
              <div>
                <Image
                  alt="Students learning together"
                  className="object-cover w-full h-full relative z-[1] rounded-3xl"
                  src="/hero-banner.png"
                  width={600}
                  height={600}
                />
                <div className="absolute w-full h-full bg-[#5792eb] left-[30px] top-[30px] rounded-3xl" />
              </div>
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8 rounded-3xl">
                <div class="bg-white/90 backdrop-blur p-4 rounded-2xl flex items-center gap-4 max-w-xs animate-bounce-slow">
                  <div class="bg-green-100 p-2 rounded-lg">
                    <BadgeCheck
                      class="text-green-600"
                      style={{
                        color: "green",
                      }}
                    />
                  </div>
                  <div>
                    <p class="text-xs font-bold !mb-0 text-slate-400 uppercase">
                      New Milestone
                    </p>
                    <p class="text-sm font-bold  text-slate-900">
                      1.2k Certifications Today
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div class="absolute -top-6 -right-6 w-24 h-24 bg-blue-400/10 rounded-full blur-2xl"></div>
            <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
