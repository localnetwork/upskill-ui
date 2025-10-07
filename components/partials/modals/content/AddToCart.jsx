import modalState from "@/lib/store/modalState";
import { Check, CheckCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
export default function AddToCart() {
  const modalInfo = modalState((state) => state.modalInfo);
  return (
    <div className="flex flex-col md:flex-row gap-[15px]">
      <div className="flex items-center gap-[15px]">
        <CheckCircle className="text-green-900" size={30} />
        <div className="w-[100px]">
          <Image
            src={
              process.env.NEXT_PUBLIC_API_DOMAIN +
              modalInfo?.data?.cover_image?.path
            }
            width={300}
            height={200}
            alt={modalInfo?.data?.title}
            className="w-full h-full block object-cover"
          />
        </div>
      </div>
      <div className="flex gap-[15px] justify-between items-center w-full max-w-[calc(100%-115px)]">
        <div>
          <h2 className="text-[16px] font-semibold ">
            {modalInfo?.data?.title}
          </h2>
          <div className="text-[14px] text-gray-600 mt-[5px]">
            {modalInfo?.data?.author?.data.firstname}{" "}
            {modalInfo?.data?.author?.data.lastname}
          </div>
        </div>
        <div>
          <Link
            href="/cart"
            onClick={() => modalState.setState({ modalInfo: null })}
            className="bg-[#0056D2] flex items-center justify-center gap-[5px] text-center max-w-[200px] font-semibold text-white px-[20px] py-[8px] rounded-[5px] w-full hover:bg-[#1d6de0]"
          >
            Go to Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
