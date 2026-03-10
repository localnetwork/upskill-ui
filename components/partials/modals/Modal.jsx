import { useEffect, useState } from "react";
import AddToCart from "./content/AddToCart";
import { X } from "lucide-react";
import modalState from "@/lib/store/modalState";
import LoginFormModal from "./content/LoginFormModal";
import CoursePromoVideo from "./content/CoursePromoVideo";

export default function Modal() {
  const modalInfo = modalState((state) => state.modalInfo);
  const size = modalInfo?.size || "md";
  const handleClose = () => {
    modalState.setState({ modalInfo: null });
    document.body.style.overflow = "auto";
  };

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (modalInfo) {
      // Start animation after mount
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [modalInfo]);

  if (!modalInfo) return null;

  let Content = null;
  switch (modalInfo.type) {
    case "LOGIN":
      Content = <LoginFormModal />;
      break;
    case "ADD_TO_CART":
      Content = <AddToCart />;
      break;
    case "COURSE_PROMO_VIDEO":
      Content = <CoursePromoVideo />;
      break;
    default:
      return null;
  }

  const sizeClasses = {
    sm: "max-w-[400px]",
    md: "max-w-[600px]",
    lg: "max-w-[800px]",
    xl: "max-w-[1000px]",
  };

  const titleClasses = {
    sm: "text-[18px]",
    md: "text-[20px]",
    lg: "text-[24px]",
    xl: "text-[28px]",
  };

  useEffect(() => {
    if (modalInfo) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, []);

  return (
    <div className="fixed inset-0 p-[50px] z-[100] flex items-center justify-center p-[50px]">
      {/* Overlay */}
      <div
        className={`fixed inset-0  cursor-pointer [background:color-mix(in_oklch,oklch(93.86%_0.0108_280.47deg)_80%,transparent)] backdrop-blur-[0.8rem] transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`${sizeClasses[size]} relative max-h-[calc(100vh-50px)] overflow-y-auto z-10 w-full  rounded-[20px] bg-white p-[24px] shadow-lg transform transition-all duration-300 ease-out ${
          visible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        <div className="flex justify-between items-center mb-[20px] gap-[20px]">
          <X
            className="absolute top-[12px] right-[12px] cursor-pointer"
            onClick={handleClose}
          />
          <h2 className={`${titleClasses[size]} font-semibold`}>
            {modalInfo.title}
          </h2>
        </div>
        {Content}
      </div>
    </div>
  );
}
