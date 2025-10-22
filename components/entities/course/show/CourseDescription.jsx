import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function CourseDescription({ description }) {
  const [expanded, setExpanded] = useState(false);

  // Split by </p> to detect paragraphs
  const paragraphs = description?.split(/<\/p>/i).filter(Boolean);
  const shouldTruncate = paragraphs?.length > 4;

  // First 4 paragraphs (preserve closing </p>)
  const previewHtml = paragraphs?.slice(0, 4).join("</p>") + "</p>";

  return (
    <div className="prose max-w-full text-gray-700 course-show-description">
      <div
        dangerouslySetInnerHTML={{
          __html: expanded || !shouldTruncate ? description : previewHtml,
        }}
      />
      {shouldTruncate && (
        <button
          className="text-blue-600 font-bold mt-3 hover:bg-[#f5f5f5] px-[5px] py-[10px] rounded-sm cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              Show Less <ChevronUp size={16} className="inline ml-1" />
            </>
          ) : (
            <>
              Show More <ChevronDown size={16} className="inline ml-1" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
