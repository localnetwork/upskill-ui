import Link from "next/link";
import Logo from "../icons/Logo";
import Cart from "../icons/Cart";

export default function Header() {
  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container">
        <div className="flex justify-between items-center py-4">
          <div className="text-2xl font-bold">
            <Link className="max-w-[180px] inline-flex h-auto" href="/">
              <Logo />
            </Link>
          </div>
          <div className="flex items-center space-x-6 w-full justify-end">
            <form action="#" method="GET" className="min-w-[50%]">
              <input
                type="text"
                placeholder="Search for anything...."
                className="border border-gray-300 rounded-[50px] py-2 px-4 w-full "
              />
            </form>

            <div className="flex items-center space-x-4">
              <span className="max-w-[30px] inline-flex h-auto">
                <Cart />
              </span>
              <nav>
                <ul className="flex space-x-4 items-center">
                  <li>
                    <Link href="/" className="hover:underline text-[#0056D2]">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/about"
                      className="hover:underline bg-[#0056D2] text-white font-semibold px-[30px] py-[10px] rounded-[50px] inline-block text-[18px] text-center"
                    >
                      Register
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
