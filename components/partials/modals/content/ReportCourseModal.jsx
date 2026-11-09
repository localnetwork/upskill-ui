import modalState from "@/lib/store/modalState";
import COURSEREPORTAPI from "@/lib/api/course-report/request";
import { useState } from "react";
import toast from "react-hot-toast";

export const COURSE_REPORT_ISSUE_OPTIONS = [
  {
    value: "HARMFUL_CONTENT",
    label: "Inappropriate Course Content - Harmful, Violent, Hateful, or Criminal",
  },
  { value: "INAPPROPRIATE_CONTENT_OTHER", label: "Inappropriate Course Content - Other" },
  { value: "INAPPROPRIATE_BEHAVIOR", label: "Inappropriate Behavior" },
  { value: "POLICY_VIOLATION", label: "Upskill Policy Violation" },
  { value: "SPAMMY_CONTENT", label: "Spammy Content" },
  { value: "INAPPROPRIATE_ADVERTISEMENT", label: "Inappropriate Advertisement Content" },
  { value: "OTHER", label: "Other" },
];

export default function ReportCourseModal() {
  const modalInfo = modalState((state) => state.modalInfo);
  const courseId = modalInfo?.data?.courseId;

  const [issueType, setIssueType] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeModal = () => {
    modalState.setState({ modalInfo: null });
    document.body.style.overflow = "auto";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmed = details.trim();
    if (!issueType) return toast.error("Select an issue type.");
    if (trimmed.length < 10) return toast.error("Describe the issue in at least 10 characters.");

    try {
      setIsSubmitting(true);
      const response = await COURSEREPORTAPI.create({ courseId, issueType, details: trimmed });
      toast.success(response?.data?.message || "Report submitted.");
      closeModal();
    } catch (error) {
      toast.error(error?.data?.message || "Unable to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="text-sm text-slate-600">
        Flagged content is reviewed by Upskill staff to determine whether it violates our Terms of
        Service or Community Guidelines. If you have a question or technical issue, please contact
        our support team.
      </p>

      <div className="space-y-1">
        <label className="text-sm font-bold text-slate-900" htmlFor="report-issue-type">
          Issue type
        </label>
        <select
          id="report-issue-type"
          value={issueType}
          onChange={(event) => setIssueType(event.target.value)}
          className="w-full rounded-lg border border-[#e2e8f0] bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Select an issue</option>
          {COURSE_REPORT_ISSUE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-bold text-slate-900" htmlFor="report-issue-details">
          Issue details
        </label>
        <textarea
          id="report-issue-details"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          maxLength={2000}
          className="w-full min-h-28 rounded-lg border border-[#e2e8f0] p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex justify-end items-center gap-2">
        <button
          type="button"
          onClick={closeModal}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-bold text-primary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-primary ${
            isSubmitting ? "opacity-70" : ""
          }`}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>
  );
}
