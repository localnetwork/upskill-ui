import { Star } from "lucide-react";

export default function CourseFeedback() {
  return (
    <div className="grid md:grid-cols-[200px_1fr] gap-8 items-center bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
      <div className="text-center md:text-left">
        <div className="text-6xl font-black text-slate-900 mb-2">4.9</div>
        <div className="flex items-center justify-center md:justify-start gap-1 text-yellow-400 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="text-yellow-400" />
          ))}
        </div>
        <div className="text-sm font-bold text-primary">Course Rating</div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-slate-800 w-[85%] rounded-full"></div>
          </div>
          <div className="flex items-center gap-1 w-24">
            <Star className="text-sm text-yellow-500 fill-1" size={18} />
            <span className="text-xs font-bold">85%</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-slate-800 w-[10%] rounded-full"></div>
          </div>
          <div className="flex items-center gap-1 w-24">
            <Star className="text-sm text-yellow-500 fill-1" size={18} />
            <span className="text-xs font-bold">10%</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-slate-300 w-[3%] rounded-full"></div>
          </div>
          <div className="flex items-center gap-1 w-24">
            <Star className="text-sm text-slate-300 fill-1" size={18} />
            <span className="text-xs font-bold">3%</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-slate-300 w-[1%] rounded-full"></div>
          </div>
          <div className="flex items-center gap-1 w-24">
            <Star className="text-sm text-slate-300 fill-1" size={18} />
            <span className="text-xs font-bold">1%</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-slate-300 w-[1%] rounded-full"></div>
          </div>
          <div className="flex items-center gap-1 w-24">
            <Star className="text-sm text-slate-300 fill-1" size={18} />
            <span className="text-xs font-bold">1%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
