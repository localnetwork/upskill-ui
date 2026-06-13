import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";
import modalState from "@/lib/store/modalState";
import {
  BadgeCheck,
  Calendar,
  Copy,
  Download,
  Medal,
  Share,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

export async function getServerSideProps(context) {
  const { slug } = context.params;
  setContext(context);

  try {
    const response = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/certifications/${slug}`,
    );
    return {
      props: {
        certificate: response?.data?.data || null,
      },
    };
  } catch (error) {
    if (error?.status === 404) {
      return { notFound: true };
    }
    return {
      redirect: {
        destination: "/my-courses/learning",
        permanent: false,
      },
    };
  }
}

export default function CertificationPage({ certificate }) {
  const issueDate = certificate?.issued_at
    ? new Date(certificate.issued_at).toLocaleDateString("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
      })
    : "—";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(certificate?.certification_url || "");
      toast.success("Certification URL copied.");
    } catch (_error) {
      toast.error("Failed to copy certification URL.");
    }
  };

  const handleDownload = () => {
    window.print();
  };

  const handleShare = () => {
    const shareUrl = certificate?.certification_url || window.location.href;
    const shareTitle = `I completed ${certificate?.course_title || "a course"} on Upskill.`;
    modalState.setState({
      modalInfo: {
        type: "SHARE_SOCIAL",
        title: "Share to social media",
        size: "sm",
        data: {
          url: shareUrl,
          title: shareTitle,
        },
      },
    });
  };

  return (
    <main className="py-24 px-4 bg-[#F8FAFC]">
      <div className="max-w-lg mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container text-[10px] font-extrabold uppercase tracking-widest mb-4">
            Verified Achievement
          </div>
          <h2 className="text-3xl font-extrabold text-secondary tracking-tight">
            Your Certification
          </h2>
          <p className="text-[#475569] mt-2 text-sm">
            Congratulations on completing your professional journey with
            Upskill.
          </p>
        </div>

        <div className="relative bg-white rounded-lg p-1 shadow-2xl overflow-hidden mb-10 certification-card">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
            <BadgeCheck size={350} className="" />
          </div>
          <div className="border-2 border-primary/10 rounded-[calc(1rem-4px)] p-6 md:p-10 relative z-10">
            <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Medal className="text-primary" />
              </div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary mb-1">
                Certificate of Completion
              </div>
              <div className="h-0.5 w-12 bg-primary/20" />
            </div>

            <div className="text-center mb-12">
              <p className="text-[#475569] text-sm font-medium italic mb-2">
                This is to certify that
              </p>
              <h3 className="text-3xl font-extrabold text-secondary tracking-tight mb-8">
                {certificate?.student_name || "Student"}
              </h3>
              <p className="text-[#475569] text-sm font-medium italic mb-2">
                has successfully completed the professional course
              </p>
              <h4 className="text-xl font-bold text-primary leading-tight px-4 italic">
                {certificate?.course_title || "Course"}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100">
              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-[#475569] mb-4">
                  Instructor
                </div>
                <div className="font-bold text-sm text-secondary">
                  {certificate?.instructor_name || "Instructor"}
                </div>
                <div className="h-[1px] w-full bg-slate-200 my-2" />
                <div className="text-[9px] text-[#475569]">
                  Upskill Lead Instructor
                </div>
              </div>
              <div className="flex flex-col items-end text-right">
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-[#475569] mb-2">
                  Official Seal
                </div>
                <div className="w-12 h-12 flex items-center bg-[#ea580c] rounded-full justify-center">
                  <ShieldCheck className="text-white" />
                </div>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 text-[9px] font-bold text-[#475569]/60 uppercase tracking-tighter">
              <div>
                Certification No:{" "}
                <span className="text-on-surface">
                  {certificate?.certification_no || "—"}
                </span>
              </div>
              <div className="text-right">
                Ref No:{" "}
                <span className="text-on-surface">
                  {certificate?.reference_no || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 mb-8 border border-[#e2e8f0] no-print">
          <h5 className="text-xs font-extrabold uppercase tracking-widest text-primary mb-4">
            Verification Metadata
          </h5>
          <div className="space-y-4">
            <button
              onClick={handleCopy}
              className="w-full flex justify-between items-center group cursor-pointer text-left"
            >
              <div className="flex flex-col">
                <span className="text-[10px] text-[#475569] uppercase font-bold tracking-tight">
                  Certification URL
                </span>
                <span className="text-sm font-semibold text-secondary break-all line-clamp-1">
                  {certificate?.certification_url || "—"}
                </span>
              </div>
              <Copy className="text-[#475569] group-hover:text-primary transition-colors" />
            </button>

            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#475569] uppercase font-bold tracking-tight">
                  Issue Date
                </span>
                <span className="text-sm font-semibold text-secondary">
                  {issueDate}
                </span>
              </div>
              <Calendar className="text-[#475569]" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 no-print">
          <button
            onClick={handleDownload}
            className="w-full bg-primary text-white py-4 rounded-full font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-transform active:scale-95 hover:brightness-110 cursor-pointer"
          >
            <Download className="" />
            Download Certificate
          </button>
          <button
            onClick={handleShare}
            className="w-full bg-white text-secondary border-2 border-secondary py-4 rounded-full font-bold flex items-center justify-center gap-3 transition-transform active:scale-95 hover:bg-slate-50 cursor-pointer"
          >
            <Share className="" />
            Share To Social Media
          </button>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .certification-card {
            box-shadow: none !important;
            margin-bottom: 0 !important;
          }
        }
      `}</style>
    </main>
  );
}
