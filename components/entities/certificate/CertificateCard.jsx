import Link from "next/link";
import { BadgeCheck, Medal, ShieldCheck } from "lucide-react";

export const formatCertificateDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export default function CertificateCard({ certification, footer = null }) {
  return (
    <div className="relative bg-white rounded-lg p-1 shadow-md overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
        <BadgeCheck size={260} />
      </div>
      <div className="relative z-10 border-2 border-[#dbeafe] rounded-[calc(0.5rem-4px)] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-full bg-[#dbeafe] flex items-center justify-center">
              <Medal className="text-[#0056D2]" size={20} />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#0056D2]">
                Certificate of Completion
              </p>
              <p className="text-[12px] text-gray-600">
                Issued: {formatCertificateDate(certification.issued_at)}
              </p>
            </div>
          </div>
          <ShieldCheck className="text-[#ea580c]" size={22} />
        </div>

        <div className="mt-5">
          <p className="text-[12px] text-gray-500 italic">
            Successfully completed
          </p>
          <p className="font-semibold text-[20px] mt-1 leading-tight">
            {certification.course_title}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold">
              Certification No
            </p>
            <p className="text-[12px] font-semibold">
              {certification.certification_no || "—"}
            </p>
          </div>
          <Link
            href={`/certifications/${certification.slug}`}
            className="rounded-full bg-[#0056D2] text-white text-[12px] font-semibold px-4 py-2 hover:opacity-90"
          >
            View certificate
          </Link>
        </div>

        {footer && (
          <div className="mt-4 border-t border-[#dbeafe] pt-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
