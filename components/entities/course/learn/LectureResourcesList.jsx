import { FileDown, Link as LinkIcon } from "lucide-react";
import { assetUrl } from "@/components/entities/course/assignment/FileUploader";

export function ResourceLink({ resource, className = "" }) {
  return (
    <a
      href={assetUrl(resource.path)}
      target="_blank"
      rel="noopener noreferrer"
      download={resource.external ? undefined : resource.name}
      className={`flex items-center gap-3 ${className}`}
    >
      {resource.external ? (
        <LinkIcon size={18} className="shrink-0" />
      ) : (
        <FileDown size={18} className="shrink-0" />
      )}
      <span className="break-all">{resource.name}</span>
    </a>
  );
}

export default function LectureResourcesList({ resources }) {
  if (!Array.isArray(resources) || resources.length === 0) return null;
  return (
    <div className="pt-4">
      <h2 className="text-xl font-bold mb-3">Resources for this lecture</h2>
      <ul className="space-y-3">
        {resources.map((resource) => (
          <li key={resource.id}>
            <ResourceLink
              resource={resource}
              className="text-primary hover:underline"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
