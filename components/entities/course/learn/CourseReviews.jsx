export default function CourseReviews() {
  return (
    <>
      <section class="px-6 py-8">
        <div class="bg-surface-container-low rounded-lg p-6 flex flex-col md:flex-row gap-8 items-center border border-outline-variant/20">
          <div class="text-center md:text-left">
            <div class="text-6xl font-extrabold text-secondary tracking-tighter">
              4.8
            </div>
            <div class="flex items-center justify-center md:justify-start gap-1 my-2">
              <span class="material-symbols-outlined text-tertiary filled-icon">
                star
              </span>
              <span class="material-symbols-outlined text-tertiary filled-icon">
                star
              </span>
              <span class="material-symbols-outlined text-tertiary filled-icon">
                star
              </span>
              <span class="material-symbols-outlined text-tertiary filled-icon">
                star
              </span>
              <span class="material-symbols-outlined text-tertiary">
                star_half
              </span>
            </div>
            <p class="text-xs font-extrabold uppercase tracking-widest text-outline-variant">
              Course Rating
            </p>
          </div>
          <div class="flex-grow w-full space-y-3">
            <div class="flex items-center gap-4">
              <span class="text-[10px] font-bold text-on-surface-variant w-4">
                5
              </span>
              <div class="h-2 flex-grow bg-outline rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary rounded-full"
                  style="width: 82%"
                ></div>
              </div>
              <span class="text-[10px] font-bold text-on-surface-variant w-8">
                82%
              </span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-[10px] font-bold text-on-surface-variant w-4">
                4
              </span>
              <div class="h-2 flex-grow bg-outline rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary rounded-full"
                  style="width: 12%"
                ></div>
              </div>
              <span class="text-[10px] font-bold text-on-surface-variant w-8">
                12%
              </span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-[10px] font-bold text-on-surface-variant w-4">
                3
              </span>
              <div class="h-2 flex-grow bg-outline rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary rounded-full"
                  style="width: 4%"
                ></div>
              </div>
              <span class="text-[10px] font-bold text-on-surface-variant w-8">
                4%
              </span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-[10px] font-bold text-on-surface-variant w-4">
                2
              </span>
              <div class="h-2 flex-grow bg-outline rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary rounded-full"
                  style="width: 1%"
                ></div>
              </div>
              <span class="text-[10px] font-bold text-on-surface-variant w-8">
                1%
              </span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-[10px] font-bold text-on-surface-variant w-4">
                1
              </span>
              <div class="h-2 flex-grow bg-outline rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary rounded-full"
                  style="width: 1%"
                ></div>
              </div>
              <span class="text-[10px] font-bold text-on-surface-variant w-8">
                1%
              </span>
            </div>
          </div>
        </div>
        <button class="w-full mt-6 bg-primary text-white font-bold py-4 rounded-full shadow-[0_8px_16px_rgba(0,86,210,0.2)] hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-xl">rate_review</span>
          Write a Review
        </button>
      </section>
      <section class="px-6 space-y-6">
        <div class="flex justify-between items-center pb-2 border-b border-outline">
          <h2 class="text-xl font-extrabold text-secondary tracking-tight">
            Recent Feedback
          </h2>
          <div class="flex items-center gap-2 text-outline-variant">
            <span class="text-xs font-bold uppercase tracking-widest">
              Sort: Latest
            </span>
            <span class="material-symbols-outlined text-sm">
              keyboard_arrow_down
            </span>
          </div>
        </div>
        <div class="group">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary-container ring-offset-2">
              <img
                alt="Student Avatar"
                class="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhkYpsrf-iAtFvbISUhulx6mLM9hiNi34Vc4kHuglHKHBGtUknEHATIjY4iIviT3dQt6-mbtCtgTLytYdbY-jrqQPltGZbuPTF7KL7F5a_WFFMLhI2uLG29bL22VLLBM5X9f54fcEol8no4XAjCzXw5t1oGCCjXyOWguMRUVpNyFZG7QjyJrocnPdWz9OSBMhGyB5T6nPJ3q87Ic4_ZmFxiKNngD3WaQy8etCm8TOCnqigIQvtxjmevGp37EdscUxPwMM_jscm1vEB"
              />
            </div>
            <div class="flex-grow">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-bold text-secondary">Marcus Chen</h3>
                  <div class="flex gap-0.5 text-tertiary">
                    <span class="material-symbols-outlined text-xs filled-icon">
                      star
                    </span>
                    <span class="material-symbols-outlined text-xs filled-icon">
                      star
                    </span>
                    <span class="material-symbols-outlined text-xs filled-icon">
                      star
                    </span>
                    <span class="material-symbols-outlined text-xs filled-icon">
                      star
                    </span>
                    <span class="material-symbols-outlined text-xs filled-icon">
                      star
                    </span>
                  </div>
                </div>
                <span class="text-[10px] font-extrabold uppercase tracking-widest text-outline-variant bg-surface-container-low px-2 py-1 rounded">
                  2 days ago
                </span>
              </div>
              <p class="mt-3 text-on-surface-variant leading-relaxed text-sm italic">
                The architect's approach to the blueprint aesthetic in this
                module was exactly what I needed. The technical precision is
                paired with real-world application that goes beyond standard
                tutorials.
              </p>
              <div class="mt-4 flex gap-4 items-center">
                <button class="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-primary">
                  <span class="material-symbols-outlined text-sm">
                    thumb_up
                  </span>{" "}
                  Helpful (12)
                </button>
                <button class="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-outline-variant">
                  <span class="material-symbols-outlined text-sm">reply</span>{" "}
                  Reply
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="group pt-6 border-t border-outline">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary-container ring-offset-2">
              <img
                alt="Student Avatar"
                class="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCR9vYuGeZJNkRRP8PLWUAiQibSrfIZEYhsxThQFlHvEQ0hH4xnxanMAiVj41UbBSQPwHQ6ViCVKfHaNUouQ8NZNg1Z6a_kUZw5snjIH2pGDrAkC0LJC55sB9Pah2_KloJxq_MoJsSOJC8MRtrrEcuAZz2obWQvwhFqNJ_wLcF0STkPyM0NXGBnaUzxqdtUlHzVaWrAgs7k29-k3W8f7F2rlY8j2IW9lVB3ApxtrNkzvFM9Y8QfnKW8vCXqhEc4HJIJFp-DfJbnykJ3"
              />
            </div>
            <div class="flex-grow">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-bold text-secondary">Sophia Rodriguez</h3>
                  <div class="flex gap-0.5 text-tertiary">
                    <span class="material-symbols-outlined text-xs filled-icon">
                      star
                    </span>
                    <span class="material-symbols-outlined text-xs filled-icon">
                      star
                    </span>
                    <span class="material-symbols-outlined text-xs filled-icon">
                      star
                    </span>
                    <span class="material-symbols-outlined text-xs filled-icon">
                      star
                    </span>
                    <span class="material-symbols-outlined text-xs">star</span>
                  </div>
                </div>
                <span class="text-[10px] font-extrabold uppercase tracking-widest text-outline-variant bg-surface-container-low px-2 py-1 rounded">
                  1 week ago
                </span>
              </div>
              <p class="mt-3 text-on-surface-variant leading-relaxed text-sm">
                Highly professional course materials. I particularly enjoyed the
                structured fluidity of the UI design section. My only minor
                critique would be to have more downloadable assets for the final
                project.
              </p>
              <div class="mt-4 flex gap-4 items-center">
                <button class="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-primary">
                  <span class="material-symbols-outlined text-sm">
                    thumb_up
                  </span>{" "}
                  Helpful (8)
                </button>
                <button class="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-outline-variant">
                  <span class="material-symbols-outlined text-sm">reply</span>{" "}
                  Reply
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="group pt-6 border-t border-outline">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary-container ring-offset-2">
              <img
                alt="Student Avatar"
                class="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCuJYrH9eU1Kt1CKAi2PEzzzdfAghsNaRpoCcRatfhpVxKnt5XMQqXh9kEyxTzIW1HE6_ZJPIQThQNjpxTibejs05yawKbVuT8KrEGnSBWAEAxj8Z_xbmwsx69CCzKlViKu4u8zl_NyghKR27Y7t_xU8CSCoKUt2A1eD4-SRheCrUiSemVJCOfKOaP3qbygYiB82TOscLJEvGND5HTYv0FX0ihfD7fI34CfBnh5NYV2VSHwGZ4__k3qU6YKTSfl5tK4R32HkKJosWR0"
              />
            </div>
            <div class="flex-grow">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-bold text-secondary">Julian Pierce</h3>
                  <div class="flex gap-0.5 text-tertiary">
                    <span class="material-symbols-outlined text-xs filled-icon">
                      star
                    </span>
                    <span class="material-symbols-outlined text-xs filled-icon">
                      star
                    </span>
                    <span class="material-symbols-outlined text-xs filled-icon">
                      star
                    </span>
                    <span class="material-symbols-outlined text-xs filled-icon">
                      star
                    </span>
                    <span class="material-symbols-outlined text-xs filled-icon">
                      star
                    </span>
                  </div>
                </div>
                <span class="text-[10px] font-extrabold uppercase tracking-widest text-outline-variant bg-surface-container-low px-2 py-1 rounded">
                  2 weeks ago
                </span>
              </div>
              <p class="mt-3 text-on-surface-variant leading-relaxed text-sm italic">
                The 'No-Line' rule mentioned in the videos has completely
                changed how I think about layout hierarchy. Excellent
                instructor.
              </p>
              <div class="mt-4 flex gap-4 items-center">
                <button class="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-primary">
                  <span class="material-symbols-outlined text-sm">
                    thumb_up
                  </span>{" "}
                  Helpful (24)
                </button>
                <button class="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-outline-variant">
                  <span class="material-symbols-outlined text-sm">reply</span>{" "}
                  Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
