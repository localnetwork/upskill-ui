import { useEffect, useState } from "react";
import AddToCart from "./content/AddToCart";
import { X } from "lucide-react";
import modalState from "@/lib/store/modalState";

export default function Modal() {
  const modalInfo = modalState((state) => state.modalInfo);
  const handleClose = () => modalState.setState({ modalInfo: null });

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
    case "ADD_TO_CART":
      Content = <AddToCart />;
      break;
    default:
      return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-[50px]">
      {/* Overlay */}
      <div
        className={`fixed inset-0 cursor-pointer [background:color-mix(in_oklch,oklch(93.86%_0.0108_280.47deg)_80%,transparent)] backdrop-blur-[0.8rem] transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative z-10 w-full max-w-[600px] rounded-[20px] bg-white p-[24px] shadow-lg transform transition-all duration-300 ease-out ${
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
          <h2 className="text-[20px] font-semibold">{modalInfo.title}</h2>
        </div>
        {Content}
      </div>
    </div>
  );
}
