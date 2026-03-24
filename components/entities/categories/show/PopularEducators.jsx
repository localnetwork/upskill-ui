import { BadgeCheck } from "lucide-react";

export default function PopularEducators({ category }) {
  return (
    <section className="mb-32 py-12">
      <div className="container">
        <div className="bg-surface-container-lowest rounded-3xl p-10 md:p-16 border border-outline-variant/30 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div className="max-w-xl">
              <span className="text-primary font-extrabold tracking-[0.2em] text-[10px] uppercase mb-4 block">
                Popular Instructors
              </span>
              <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface">
                These real-world experts are highly rated by learners like you.
              </h2>
            </div>
            <button className="mt-8 md:mt-0 px-8 py-4 bg-on-surface text-surface rounded-xl font-extrabold text-sm hover:bg-primary transition-all duration-300 shadow-lg active:scale-95">
              View All Experts
            </button>
          </div>
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-5 gap-10">
            <div className="flex flex-col items-center text-center group cursor-pointer">
              <div className="relative mb-6">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-surface-container p-1 group-hover:border-primary transition-colors duration-500"></div>
                <div className="absolute bottom-1 right-1 bg-primary text-white p-1 rounded-full border-2 border-surface-container-lowest">
                  <BadgeCheck className="text-[12px]" />
                </div>
              </div>
              <h4 className="font-headline font-extrabold text-on-surface text-lg mb-1">
                Aris Thorne
              </h4>
              <p className="text-[11px] text-secondary font-bold uppercase tracking-widest opacity-70">
                Core Architecture
              </p>
            </div>
            <div className="flex flex-col items-center text-center group cursor-pointer">
              <div className="relative mb-6">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-surface-container p-1 group-hover:border-primary transition-colors duration-500"></div>
              </div>
              <h4 className="font-headline font-extrabold text-on-surface text-lg mb-1">
                Elena Rodriguez
              </h4>
              <p className="text-[11px] text-secondary font-bold uppercase tracking-widest opacity-70">
                JS Engineering
              </p>
            </div>
            <div className="flex flex-col items-center text-center group cursor-pointer">
              <div className="relative mb-6">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-surface-container p-1 group-hover:border-primary transition-colors duration-500"></div>
              </div>
              <h4 className="font-headline font-extrabold text-on-surface text-lg mb-1">
                Marcus Vane
              </h4>
              <p className="text-[11px] text-secondary font-bold uppercase tracking-widest opacity-70">
                DevOps Specialist
              </p>
            </div>
            <div className="flex flex-col items-center text-center group cursor-pointer">
              <div className="relative mb-6">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-surface-container p-1 group-hover:border-primary transition-colors duration-500"></div>
              </div>
              <h4 className="font-headline font-extrabold text-on-surface text-lg mb-1">
                Sarah Jenkins
              </h4>
              <p className="text-[11px] text-secondary font-bold uppercase tracking-widest opacity-70">
                UI/UX Engineer
              </p>
            </div>
            <div className="flex flex-col items-center text-center group cursor-pointer">
              <div className="relative mb-6">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-surface-container p-1 group-hover:border-primary transition-colors duration-500"></div>
              </div>
              <h4 className="font-headline font-extrabold text-on-surface text-lg mb-1">
                Leo Kashyap
              </h4>
              <p className="text-[11px] text-secondary font-bold uppercase tracking-widest opacity-70">
                Backend Systems
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-[80px]"></div>
        </div>
      </div>
    </section>
  );
}
