"use client";

import { instructorNavLinks } from "@/lib/menu/instructorDashboardLinks";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function InstructorSidebar() {
  const pathname = usePathname();

  return (
    <div className="bg-[#f5f5f5] h-full">
      <nav className="sticky top-[100px] py-[50px]">
        <ul>
          {instructorNavLinks.map((link) => {
            const isActive =
              pathname === link.link || pathname.includes(link.link);

            return (
              <li className="text-[25px]" key={link.name}>
                <Link
                  href={link.link}
                  className={`flex items-center border-b border-[#e7e7e7] gap-[15px] py-[20px] px-[30px] font-semibold hover:bg-white ${
                    isActive ? "bg-white text-[#3588FC]" : ""
                  }`}
                >
                  {link.icon && <>{link.icon}</>}
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
