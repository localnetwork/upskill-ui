import Link from "next/link";
import { useRouter } from "next/router";
export default function MyCoursesLayout({ children, title }) {
  const router = useRouter();
  const menuLinks = [
    { name: "All Courses", href: "/my-courses/learning" },
    { name: "Wishlist", href: "/my-courses/wishlist" },
  ];
  return (
    <div>
      <div className="bg-[#16161D] pt-[50px] text-white">
        <div className="mx-auto px-[20px] max-w-[1300px] pb-[50px]">
          <h1 className=" text-[50px] font-semibold">{title}</h1>

          <div className="mb-[-35px] mt-[50px] font-bold text-[20px] flex gap-[20px]">
            {menuLinks.map((link) => (
              <div key={link.name} className="item">
                <Link
                  href={link.href}
                  className={`${
                    link.href === router.pathname
                      ? "border-b-4 border-white pb-3"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  {link.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-[20px] py-[50px]">
        {children}
      </div>
    </div>
  );
}
