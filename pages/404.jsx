import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Custom404() {
  return (
    <>
      <main className="min-h-screen flex items-center justify-center px-6 pt-20 pb-24">
        <div className="max-w-3xl w-full text-center">
          <div className="relative inline-block mb-12">
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary-container/5 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-tertiary/5 rounded-full blur-2xl -z-10"></div>
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-md aspect-video mb-8 overflow-hidden rounded-xl bg-surface-container-low group">
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent"></div>
              </div>
              <h1 className="font-headline text-[8rem] md:text-[12rem] font-extrabold leading-none tracking-tighter text-primary/10 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] -z-10">
                404
              </h1>
            </div>
          </div>
          <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface">
              Oops! We can't find that page.
            </h2>
            <p className="font-body text-lg text-secondary leading-relaxed max-w-lg mx-auto">
              It looks like the link might be broken or the page has been moved.
              Let's get you back to learning.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link
                href="/"
                className="w-full sm:w-auto px-8 py-4 bg-[#0048B3] text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                Go to Home
              </Link>
              <Link
                href="/courses"
                className="w-full sm:w-auto px-8 py-4 bg-[#E5E2E1] text-black font-bold rounded-lg hover:bg-surface-container-high active:scale-95 transition-all"
              >
                Browse Courses
              </Link>
            </div>
            <div className="pt-8">
              <Link
                className="group inline-flex items-center gap-2 text-primary font-bold hover:text-primary-container transition-colors"
                href="/contact"
              >
                <span>Contact Support</span>

                <ArrowRight className="text-[18px] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
