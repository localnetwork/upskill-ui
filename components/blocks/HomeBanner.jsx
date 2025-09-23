import Image from "next/image";
import Link from "next/link";

export default function HomeBanner() {
  return (
    <div className="banner bg-[#F0F6FF] pt-[100px]">
      <div className="container">
        <div className="flex">
          <div className="w-[55%] lg:pr-20 pb-[100px]">
            <p className="text-[50px] lg:text-5xl font-semibold mb-6 lg:mb-0 text-center lg:text-left">
              Achieve your career goals with
            </p>

            <h1 className="text-[#0056D2] font-bold text-[71px] mb-10">
              Upskill Learning
            </h1>
            <p className="text-[20px] mb-6 text-center lg:text-left">
              Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque
              faucibus ex sapien vitae pellentesque sem placerat.
            </p>

            <div>
              <Link
                href="#"
                className="bg-[#0056D2] text-white font-semibold px-[30px] py-[10px] rounded-[50px] mt-6 inline-block min-w-[203px] text-[30px] text-center"
              >
                Start Now
              </Link>
            </div>
          </div>
          <div className="w-[45%] flex items-end">
            <Image src="/hero.png" alt="Hero Image" width={1200} height={800} />
          </div>
        </div>
      </div>
    </div>
  );
}
