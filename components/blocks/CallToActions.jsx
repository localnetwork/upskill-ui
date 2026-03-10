import { Medal, Rocket, SearchCheck } from "lucide-react";
import Image from "next/image";

export default function CallToActions() {
  const data = [
    {
      title: "Lauch a new career",
      description:
        "Entry-level tracks for beginners to start from scratch. No prior experience required.",
      icon: <Rocket className="w-10 h-10 " />,
      borderColor: "#63a1ff",
      bgColor: "#e7f0ff",
      img: "/cta-1.jpg",
    },
    {
      title: "Get in-demand skills",
      description:
        "Stay ahead with the latest technologies used by top global companies today.",
      icon: <SearchCheck className="w-10 h-10 " />,
      borderColor: "#fbd4a6",
      bgColor: "#fff4e6",
      img: "/cta-2.jpg",
    },
    {
      title: "Earn Certifications",
      description:
        "Verified credentials from world-renowned institutions to boost your professional profile.",
      icon: <Medal className="w-10 h-10 " />,
      borderColor: "#b06ff7",
      bgColor: "#f3e8ff",
      img: "/cta-3.jpg",
    },
  ];
  return (
    <section className="bg-[#F8FAFC] py-[80px]">
      <div className="container">
        <h2 className="font-extrabold font-secondary text-5xl text-center mb-16">
          Everything you need to succeed
        </h2>
        <div className="grid grid-cols-3 gap-[30px]">
          {data.map((item, index) => (
            <div
              key={index}
              className="p-[30px] flex flex-col rounded-lg mb-6 overflow-hidden"
              style={{
                border: `1px solid ${item.borderColor || "#e5e7eb"}`,
                backgroundColor: item.bgColor || "#ffffff",
              }}
            >
              <span
                className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"
                style={{ color: item.borderColor || "#e5e7eb" }}
              >
                {item.icon}
              </span>
              <h3 className="text-2xl font-bold mb-4 mt-4">{item.title}</h3>

              <div className="text-slate-600 grow mb-8 leading-relaxed">
                {item.description}
              </div>

              <div className="flex ">
                <Image
                  src={item.img}
                  alt={item.title}
                  width={400}
                  height={300}
                  className="mt-3 rounded-xl object-cover w-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
