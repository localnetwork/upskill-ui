export default function QuizProgressHeader({
  title,
  progressPct,
  currentIndex,
  totalQuestions,
  passingScore,
}) {
  return (
    <>
      <section className="mb-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <span className="font-label text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">
              Certification Path
            </span>
            <h2 className="text-3xl font-headline font-extrabold text-[#475569] leading-tight">
              {title}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-primary font-bold text-lg">{progressPct}%</span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#475569]/60">
              Complete
            </p>
          </div>
        </div>
        <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(0,86,210,0.4)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 mb-10">
        <div className="bg-gray-100 p-4 rounded-[35px] border border-[#e2e8f0]/50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#475569]/70 mb-1">
            Question
          </p>
          <p className="text-lg font-bold text-[#475569]">
            {Math.min(currentIndex + 1, Math.max(totalQuestions, 1))}{" "}
            <span className="text-sm font-medium text-[#333]/40">
              / {totalQuestions || 0}
            </span>
          </p>
        </div>
        <div className="bg-gray-100 p-4 rounded-[35px] border border-[#e2e8f0]/50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#475569]/70 mb-1">
            Pass Mark
          </p>
          <p className="text-lg font-bold text-[#475569]">{passingScore}%</p>
        </div>
      </div>
    </>
  );
}
