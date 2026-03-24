import React from "react";
import Logo from "../icons/Logo";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white py-16 px-4 lg:px-8 hidden md:block">
      <div className="max-w-[1440px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md ">
              <Image
                src="/logo.png"
                alt="Upskill Logo"
                width={150}
                height={50}
                className="w-auto min-w-[150px] filter brightness-0 invert"
              />
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            Empowering the next generation of creators and engineers through
            high-quality online education.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-6">Explore</h4>
          <ul className="space-y-4 text-sm text-slate-400">
            <li>
              <Link className="hover:text-white" href="#">
                Courses
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href="#">
                Educators
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href="#">
                Success Stories
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href="#">
                Business
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6">Company</h4>
          <ul className="space-y-4 text-sm text-slate-400">
            <li>
              <Link className="hover:text-white" href="/about">
                About Us
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href="#">
                Careers
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href="#">
                Contact
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href="#">
                Blog
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6">Support</h4>
          <ul className="space-y-4 text-sm text-slate-400">
            <li>
              <Link className="hover:text-white" href="#">
                Help Center
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href="#">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href="#">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href="#">
                Cookies
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
