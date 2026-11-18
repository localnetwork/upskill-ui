import modalState from "@/lib/store/modalState";
import { Check, CheckCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
export default function AddToCart() {
  const modalInfo = modalState((state) => state.modalInfo);

  const handleClose = () => {
    modalState.setState({ modalInfo: null });
    document.body.style.overflow = "auto";
  };

  return (
    <div className="flex flex-col gap-[15px] sm:flex-row">
      <div className="flex items-center gap-[15px]">
        <CheckCircle className="shrink-0 text-green-900" size={30} />
        <div className="w-[100px] shrink-0">
          <Image
            src={modalInfo?.data?.cover_image?.path}
            width={300}
            height={200}
            alt={modalInfo?.data?.title}
            className="w-full block object-cover h-[80px]"
          />
        </div>
        <div className="min-w-0 sm:hidden">
          <h2 className="line-clamp-3 break-words text-[15px] font-semibold">
            {modalInfo?.data?.title}
          </h2>
          <div className="mt-[3px] text-[13px] text-gray-600">
            {modalInfo?.data?.author?.data.fullName}
          </div>
        </div>
      </div>
      <div className="flex w-full min-w-0 flex-1 flex-col gap-[15px] sm:flex-row sm:items-center sm:justify-between">
        <div className="hidden min-w-0 sm:block">
          <h2 className="break-words text-[16px] font-semibold">
            {modalInfo?.data?.title}
          </h2>
          <div className="text-[14px] text-gray-600 mt-[5px]">
            {modalInfo?.data?.author?.data.fullName}
          </div>
        </div>
        <div className="sm:shrink-0">
          <Link
            href="/cart"
            onClick={handleClose}
            className="bg-[#0056D2] min-w-[120px] flex items-center justify-center gap-[5px] text-center sm:max-w-[200px] font-semibold text-white px-[20px] py-[8px] rounded-[5px] w-full hover:bg-[#1d6de0]"
          >
            Go to Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
