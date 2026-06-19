export default function FinalCTA() {
  return (
    <section class="bg-[#F9FAFB] px-6 md:px-8 py-24">
      <div className="container max-w-7xl mx-auto">
        <div class="relative bg-[#0F111A] text-white rounded-[3rem] p-12 md:p-24 overflow-hidden text-center">
          <div class="relative z-10 space-y-8 max-w-3xl mx-auto">
            <p class="text-primary font-black uppercase tracking-[0.2em] text-xs">
              Start Today
            </p>
            <h2 class="text-5xl md:text-7xl font-extrabold leading-[1] tracking-tighter">
              Your next chapter starts{" "}
              <span class="text-primary italic">now.</span>
            </h2>
            <p class="text-xl text-white/60">
              Join 2.4 million learners building skills that matter. First 7
              days completely free.
            </p>
            <div class="flex flex-col md:flex-row justify-center gap-6 pt-4">
              <button class="px-10 py-5 bg-primary text-on-primary rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(0,86,210,0.4)]">
                Start learning free —&gt;
              </button>
              <button class="px-10 py-5 bg-white/10 border border-white/20 rounded-full font-bold text-lg hover:bg-white/20 transition-all">
                Explore courses
              </button>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-12 pt-16 border-t border-white/10">
              <div>
                <p class="text-3xl font-black">2.4M+</p>
                <p class="text-xs uppercase tracking-widest text-white/40 mt-2">
                  Active learners
                </p>
              </div>
              <div>
                <p class="text-3xl font-black">$0</p>
                <p class="text-xs uppercase tracking-widest text-white/40 mt-2">
                  To start, 7 days free
                </p>
              </div>
              <div>
                <p class="text-3xl font-black">30-day</p>
                <p class="text-xs uppercase tracking-widest text-white/40 mt-2">
                  Money-back guarantee
                </p>
              </div>
              <div>
                <p class="text-3xl font-black">800+</p>
                <p class="text-xs uppercase tracking-widest text-white/40 mt-2">
                  Hiring partners
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
