export default function Testimonials() {
  return (
    <section class="py-24 bg-[#F9FAFB] overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-4xl md:text-5xl font-bold text-slate-900 mb-12 text-center font-secondary">
          What our students say
        </h2>
        <div class="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x md:grid md:grid-cols-3 md:overflow-visible">
          <div class="min-w-[85vw] md:min-w-0 snap-center bg-white border border-slate-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center gap-4 mb-6">
              {/* <img alt="Student" class="w-14 h-14 rounded-full bg-slate-100 border border-slate-50" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrSZCsXpUBY-4bFS2oKphjZGngF2gf7u31VXZsU6vZotR0hwREM6d0N5l-h3zOB79RxYR1mgnYhSRh2Wg5OWBBt1D6hhX0n8CmDenogPfR9bOvJdlxoKqla2WbjmeTXdM7S1EwbofTMy4UZvyPnSWJrJ2DJKAsPmVbR4FKCFvpJesQTE8H599K4nUvi4VJxZIXMy_czywsIYeyxR8cTIxoefBT7AhoPrSNbFga1k7HZ4aY_JREEBK1kerfJjmzy2TnfGUcT9cNmPSQ"> */}
              <div>
                <h4 class="font-bold text-slate-900">Sarah Jenkins</h4>
                <p class="text-xs text-slate-500">
                  Junior Web Developer at Google
                </p>
              </div>
            </div>
            <div class="flex text-orange-400 mb-4">
              <span class="material-symbols-outlined text-sm fill-1">star</span>
              <span class="material-symbols-outlined text-sm fill-1">star</span>
              <span class="material-symbols-outlined text-sm fill-1">star</span>
              <span class="material-symbols-outlined text-sm fill-1">star</span>
              <span class="material-symbols-outlined text-sm fill-1">star</span>
            </div>
            <p class="text-slate-600 leading-relaxed italic">
              "The Full-Stack path was a complete game-changer. I went from zero
              coding knowledge to landing my dream role in just six months. The
              projects are actually relevant to real-world tasks."
            </p>
          </div>
          <div class="min-w-[85vw] md:min-w-0 snap-center bg-white border border-slate-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center gap-4 mb-6">
              {/* <img alt="Student" class="w-14 h-14 rounded-full bg-slate-100 border border-slate-50" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBI6EcJcUlySY6DdyrUMrx3U11nELnkvv8-19F960cxCRtEar7dvpOwPFtCr13C0mvD88_UnNAtN9GJ8KksRU_R5NLzRjM3HL-HMM7qa7pDKiFjSIxNruJhEi4gpSYkMzkpprAB2VBj7P3lJofL-c3T_kna9glvPBslu45VkoWek0gJDADj4oWXOWbvfCBAS4vEBJb8-sCwVutk8cf4zQ95VbrNk8GRaOHpcErLfBSdxBSryKVzyx4aSBi7y120qvFvDTCYvby2RiZq"> */}
              <div>
                <h4 class="font-bold text-slate-900">David Chen</h4>
                <p class="text-xs text-slate-500">Data Analyst at Microsoft</p>
              </div>
            </div>
            <div class="flex text-orange-400 mb-4">
              <span class="material-symbols-outlined text-sm fill-1">star</span>
              <span class="material-symbols-outlined text-sm fill-1">star</span>
              <span class="material-symbols-outlined text-sm fill-1">star</span>
              <span class="material-symbols-outlined text-sm fill-1">star</span>
              <span class="material-symbols-outlined text-sm fill-1">star</span>
            </div>
            <p class="text-slate-600 leading-relaxed italic">
              "Upskill Learning provided exactly what I needed to pivot into
              Data Science. The mentors are incredibly supportive and the IBM
              certification really stood out on my resume during my interviews."
            </p>
          </div>
          <div class="min-w-[85vw] md:min-w-0 snap-center bg-white border border-slate-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center gap-4 mb-6">
              {/* <img alt="Student" class="w-14 h-14 rounded-full bg-slate-100 border border-slate-50" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSdoxk22dJ6BRuleKe53epd2VGNW-JLrWjjTtzBYDqmeSvcqZRnhG_QRSHrvZvDBTS6hOnLaE2sLryJB9S4jY85eDGPsKn9TbCINY2OIqKAeU231QWAf0hZnSNWcsXTdiWmBHksY4hCuDjk4G4kWz8OxNIcsapZdhJ8C28ryPR95VS5XuZKdbQCDVo4hUCN-trDcVDQfaACE-Y0zGCE10WeQkvAhzkxqKbWVpjz9Q8ekt0ow6-HwTb5TE4K60jcEU6oeMkmE5dqHpc"> */}
              <div>
                <h4 class="font-bold text-slate-900">Elena Rodriguez</h4>
                <p class="text-xs text-slate-500">UX Designer at Netflix</p>
              </div>
            </div>
            <div class="flex text-orange-400 mb-4">
              <span class="material-symbols-outlined text-sm fill-1">star</span>
              <span class="material-symbols-outlined text-sm fill-1">star</span>
              <span class="material-symbols-outlined text-sm fill-1">star</span>
              <span class="material-symbols-outlined text-sm fill-1">star</span>
              <span class="material-symbols-outlined text-sm fill-1">star</span>
            </div>
            <p class="text-slate-600 leading-relaxed italic">
              "The UI/UX course gave me a rock-solid portfolio. I loved how the
              curriculum focused on user psychology as much as visual tools. It
              truly prepared me for the design industry."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
