import { useRouter } from "next/router";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import CommunityView from "@/components/entities/community/CommunityView";

export default function CourseCommunityPage() {
  const router = useRouter();
  const slug = router.query.slug;
  if (!slug) return null;

  return (
    <div className="bg-[#F3F4F6] px-4 py-6 min-h-[70vh]">
      <div className="mx-auto mb-3 max-w-4xl">
        <Link href={`/courses/${slug}/learn`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ChevronLeft size={16} /> Back to course
        </Link>
      </div>
      <CommunityView slug={String(slug)} courseHref={`/courses/${slug}`} redirectIfRestricted />
    </div>
  );
}
