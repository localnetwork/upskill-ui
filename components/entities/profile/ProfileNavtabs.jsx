import Link from "next/link";
import { useRouter } from "next/router";
export default function ProfileNavTabs() {
  const router = useRouter();
  const links = [
    { name: "Upskill Profile", href: "/profile/basic-information" },
    { name: "Profile Picture", href: "/profile/photo" },
  ];
  return (
    <div className="flex mt-[30px] mb-[20px] items-center space-x-4 shadow-[inset_0_-1px_0_0_#d1d2e0]">
      {links.map((link, index) => (
        <div key={index}>
          <Link
            href={link.href}
            className={`${router.pathname === link.href ? "text-black" : "text-[#595c73]"} py-2 relative inline-block font-semibold rounded-md text-[20px]  hover:text-black`}
          >
            {link.name}
            {router.pathname === link.href && (
              <span className="absolute bottom-[1px] left-0 w-full h-[1px] bg-black rounded-md" />
            )}
          </Link>
        </div>
      ))}
    </div>
  );
}
