import Image from "next/image";

export default function CourseReviews() {
  return (
    <section className="space-y-8" id="reviews">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-black serif-heading">Reviews</h2>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 rounded-full border border-slate-900 bg-slate-900 text-white text-xs font-bold transition-all">
            Most Recent
          </button>
          <button className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 text-xs font-bold hover:border-slate-400 transition-all">
            Highest Rated
          </button>
          <button className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 text-xs font-bold hover:border-slate-400 transition-all">
            Lowest Rated
          </button>
        </div>
      </div>
      <div className="space-y-8">
        <div className="p-6 border border-slate-100 rounded-2xl bg-white shadow-sm">
          <div className="flex gap-4 items-start mb-4">
            <Image
              alt="Alex M."
              className="w-12 h-12 rounded-full bg-slate-100"
              src=""
              width={48}
              height={48}
            />
            <div>
              <h4 className="font-bold text-slate-900">Alex Montgomery</h4>
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                  <span className="material-symbols-outlined text-xs fill-1">
                    star
                  </span>
                  <span className="material-symbols-outlined text-xs fill-1">
                    star
                  </span>
                  <span className="material-symbols-outlined text-xs fill-1">
                    star
                  </span>
                  <span className="material-symbols-outlined text-xs fill-1">
                    star
                  </span>
                  <span className="material-symbols-outlined text-xs fill-1">
                    star
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  2 weeks ago
                </span>
              </div>
            </div>
          </div>
          <p className="text-slate-600 leading-relaxed italic">
            "One of the best courses I've ever taken. The instructor explains
            complex concepts with such clarity. The hands-on projects were
            exactly what I needed for my portfolio."
          </p>
        </div>
        <div className="p-6 border border-slate-100 rounded-2xl bg-white shadow-sm">
          <div className="flex gap-4 items-start mb-4">
            <Image
              alt="Sarah J."
              className="w-12 h-12 rounded-full bg-slate-100"
              src=""
              width={48}
              height={48}
            />
            <div>
              <h4 className="font-bold text-slate-900">Sarah Jenkins</h4>
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                  <span className="material-symbols-outlined text-xs fill-1">
                    star
                  </span>
                  <span className="material-symbols-outlined text-xs fill-1">
                    star
                  </span>
                  <span className="material-symbols-outlined text-xs fill-1">
                    star
                  </span>
                  <span className="material-symbols-outlined text-xs fill-1">
                    star
                  </span>
                  <span className="material-symbols-outlined text-xs fill-1">
                    star
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  1 month ago
                </span>
              </div>
            </div>
          </div>
          <p className="text-slate-600 leading-relaxed italic">
            "The content is very up-to-date. I loved the section on Cloud
            Architecture, it's something that is often missing from other
            full-stack bootcamps."
          </p>
        </div>
        <div className="p-6 border border-slate-100 rounded-2xl bg-white shadow-sm">
          <div className="flex gap-4 items-start mb-4">
            <Image
              alt="David K."
              className="w-12 h-12 rounded-full bg-slate-100"
              src=""
              width={48}
              height={48}
            />
            <div>
              <h4 className="font-bold text-slate-900">David Kwon</h4>
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                  <span className="material-symbols-outlined text-xs fill-1">
                    star
                  </span>
                  <span className="material-symbols-outlined text-xs fill-1">
                    star
                  </span>
                  <span className="material-symbols-outlined text-xs fill-1">
                    star
                  </span>
                  <span className="material-symbols-outlined text-xs fill-1">
                    star
                  </span>
                  <span className="material-symbols-outlined text-xs">
                    star
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  1 month ago
                </span>
              </div>
            </div>
          </div>
          <p className="text-slate-600 leading-relaxed italic">
            "Great pace and depth. The only reason it's 4 stars for me is I wish
            there were more exercises for the database section, but overall
            fantastic."
          </p>
        </div>
      </div>
      <button className="w-full py-4 bg-white border-2 border-slate-900 text-slate-900 font-black rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all">
        Show More Reviews
      </button>
    </section>
  );
}
