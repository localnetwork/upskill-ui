import Link from "next/link";
import Logo from "../icons/Logo";
import Cart from "../icons/Cart";
import { isLoggedIn } from "@/lib/services/auth";
import { useEffect, useState } from "react";
import UserNav from "../entities/user/UserNav";
import persistentStore from "@/lib/store/persistentStore";
import UserResendNotif from "../entities/user/UserResendNotif";
import CARTAPI from "@/lib/api/cart/request";
import cartStore from "@/lib/store/cartStore";
import dynamic from "next/dynamic";
const UserCartCount = dynamic(() => import("../entities/user/UserCartCount"), {
  ssr: false,
});
export default function Header() {
  const profile = persistentStore((state) => state.profile);

  return (
    <>
      {profile && profile?.verified === 0 && <UserResendNotif />}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl font-bold">
              <Link className="max-w-[180px] inline-flex h-auto" href="/">
                <Logo />
              </Link>
            </div>
            <div className="flex items-center space-x-6 w-full justify-end">
              <form className="min-w-[50%]">
                <input
                  name="search"
                  type="text"
                  placeholder="Browse courses..."
                  className="border border-gray-300 rounded-[50px] py-2 px-4 w-full "
                />
              </form>

              <div className="flex items-center space-x-4">
                <span className="max-w-[30px] inline-flex h-auto relative">
                  {!profile ? (
                    <>
                      <Cart />
                      <span className="absolute -mt-2 ml-3 text-[12px] font-bold bg-red-600 text-white rounded-full px-1">
                        0
                      </span>
                    </>
                  ) : (
                    <UserCartCount />
                  )}
                </span>

                {!profile ? (
                  <nav>
                    <ul className="flex space-x-4 items-center">
                      <li>
                        <Link
                          href="/login"
                          className="hover:underline text-[#0056D2]"
                        >
                          Login
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/register"
                          className="hover:underline bg-[#0056D2] text-white font-semibold px-[30px] py-[10px] rounded-[50px] inline-block text-[18px] text-center"
                        >
                          Register
                        </Link>
                      </li>
                    </ul>
                  </nav>
                ) : (
                  <UserNav />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
