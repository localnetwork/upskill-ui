import { AlertTriangle } from "lucide-react";

export default function CourseSuspendedNotice({ suspension, isEnrolled = false, className = "" }) {
  if (!suspension) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 ${className}`}
    >
      <AlertTriangle size={20} className="mt-0.5 shrink-0" />
      <div className="text-sm">
        <p className="font-bold">This course is suspended</p>
        <p className="mt-0.5">
          It is hidden from the public and can no longer be purchased or enrolled in.
          {isEnrolled
            ? " You can still view the course and its lessons."
            : " Only enrolled learners, the author and staff can see it."}
        </p>
        {suspension.reason ? (
          <p className="mt-1">
            <span className="font-semibold">Reason:</span> {suspension.reason}
          </p>
        ) : null}
      </div>
    </div>
  );
}
