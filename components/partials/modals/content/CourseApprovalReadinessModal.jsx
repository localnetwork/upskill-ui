import modalState from "@/lib/store/modalState";
import { ApprovalReadinessDetails } from "@/components/entities/course/CourseApprovalReadiness";

export default function CourseApprovalReadinessModal() {
  const modalInfo = modalState((state) => state.modalInfo);
  const course = modalInfo?.data?.course;

  const closeModal = () => {
    modalState.setState({ modalInfo: null });
    document.body.style.overflow = "auto";
  };

  if (!course) return null;

  return <ApprovalReadinessDetails course={course} onNavigate={closeModal} />;
}
