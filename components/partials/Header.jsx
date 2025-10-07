import Link from "next/link";
import Logo from "../icons/Logo";
import Cart from "../icons/Cart";
import { useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import persistentStore from "@/lib/store/persistentStore";
import globalStore from "@/lib/store/globalStore";
import UserNav from "../entities/user/UserNav";
import UserResendNotif from "../entities/user/UserResendNotif";

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
                  className="border border-gray-300 rounded-[50px] py-2 px-4 w-full"
                />
              </form>

              <div className="flex items-center space-x-4 relative">
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

                {/* Drawer */}
                {cartDrawerOpen && <CartDrawer />}

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
