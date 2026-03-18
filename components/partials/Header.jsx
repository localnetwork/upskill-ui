import Link from "next/link";
import Logo from "../icons/Logo";
// import Cart from "../icons/Cart";
import { useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import persistentStore from "@/lib/store/persistentStore";
import globalStore from "@/lib/store/globalStore";
import UserNav from "../entities/user/UserNav";
import UserResendNotif from "../entities/user/UserResendNotif";
import Image from "next/image";
import { Search, ShoppingCart } from "lucide-react";

const UserCartCount = dynamic(() => import("../entities/user/UserCartCount"), {
  ssr: false,
});

const CartDrawer = dynamic(() => import("../entities/cart/CartDrawer"), {
  ssr: false,
});

export default function Header() {
  const profile = persistentStore((state) => state.profile);
  const cartDrawerOpen = globalStore((state) => state.cartDrawerOpen);
  const setCartDrawerOpen = (val) =>
    globalStore.setState({ cartDrawerOpen: val });

  const drawerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        !e.composedPath().some((el) => el.classList?.contains("cart-drawer"))
      ) {
        setCartDrawerOpen(false);
      }
    }

    if (cartDrawerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [cartDrawerOpen]);

  return (
    <>
      {profile && profile.verified === 0 && <UserResendNotif />}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center text-2xl font-bold">
              <Link className="max-w-[180px] mr-5 inline-flex h-auto" href="/">
                {/* <Logo /> */}
                <Image
                  src="/logo.png"
                  alt="Upskill Logo"
                  width={150}
                  height={50}
                  className="w-auto min-w-[150px]"
                />
              </Link>

              <div className="mt-1">
                <div class="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
                  <Link class="hover:text-primary transition-colors" href="#">
                    Explore
                  </Link>
                  <Link class="hover:text-primary transition-colors" href="#">
                    Courses
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex font-light items-center space-x-6 w-full justify-end">
              {/* {!profile && (
                <div>
                  <Link
                    href="/register?mode=instructor"
                    className="hover:bg-[#F0F6FF] py-[10px] rounded-[5px] px-[10px] hover:text-[#0056D2]"
                  >
                    Teach on Upskill
                  </Link>
                </div>
              )} */}
              <div class="hidden md:flex relative w-48 lg:w-64">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg"
                  size={15}
                />
                <input
                  class="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Search..."
                  type="text"
                />
              </div>
              <div className="flex items-center space-x-4 relative">
                <span className="max-w-[30px] inline-flex h-auto relative">
                  {!profile ? (
                    <>
                      {/* <Cart /> */}
                      <ShoppingCart className="w-6 h-6 text-slate-600" />
                      <span className="absolute -mt-2 ml-3 text-[12px] font-bold bg-red-600 text-white rounded-full px-1">
                        0
                      </span>
                    </>
                  ) : (
                    <UserCartCount />
                  )}
                </span>

                {/* Drawer */}
                {cartDrawerOpen && <CartDrawer />}
                <div class="h-6 w-px bg-slate-200 hidden sm:block"></div>
                {!profile ? (
                  <nav>
                    <ul className="flex space-x-4 items-center">
                      <li>
                        <Link
                          href="/login"
                          className="text-sm font-bold text-slate-700 px-4 py-2 hover:bg-gray-100 rounded-lg"
                        >
                          Login
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/register?mode=student"
                          className="bg-[#0056D2] text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-slate-800 transition-all"
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
