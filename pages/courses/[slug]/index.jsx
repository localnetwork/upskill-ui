import { useRouter } from "next/router";
export default function Course() {
  const router = useRouter();
  const { slug } = router.query;

  console.log("slug", slug);

  console.log("slug", slug);

  return (
    <div>
      <div className="relative py-[50px] px-[30px] text-white">
        <span className="absolute inset-0 bg-[#16161D] h-[250px] z-0" />
        <div className="container relative">
          <div className="grid max-w-[1180px] mx-auto grid-cols-2">
            <div>
              <h1 className="text-[35px] mb-3 font-semibold ">
                Complete web development course
              </h1>

              <div className="text-[20px] mb-[20px] font-light">
                Only web development course that you will need. Covers HTML,
                CSS, Tailwind, Node, React, MongoDB, Prisma, Deployment etc
              </div>

              <div>
                Created by{" "}
                <span className="text-[18px] text-[#3588FC]">Diome Nike</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
