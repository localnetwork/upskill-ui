import React from "react";
import Logo from "../icons/Logo";
import Image from "next/image";

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
              <a className="hover:text-white" href="#">
                Courses
              </a>
            </li>
            <li>
              <a className="hover:text-white" href="#">
                Mentors
              </a>
            </li>
            <li>
              <a className="hover:text-white" href="#">
                Success Stories
              </a>
            </li>
            <li>
              <a className="hover:text-white" href="#">
                Business
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6">Company</h4>
          <ul className="space-y-4 text-sm text-slate-400">
            <li>
              <a className="hover:text-white" href="#">
                About Us
              </a>
            </li>
            <li>
              <a className="hover:text-white" href="#">
                Careers
              </a>
            </li>
            <li>
              <a className="hover:text-white" href="#">
                Contact
              </a>
            </li>
            <li>
              <a className="hover:text-white" href="#">
                Blog
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6">Support</h4>
          <ul className="space-y-4 text-sm text-slate-400">
            <li>
              <a className="hover:text-white" href="#">
                Help Center
              </a>
            </li>
            <li>
              <a className="hover:text-white" href="#">
                Terms of Service
              </a>
            </li>
            <li>
              <a className="hover:text-white" href="#">
                Privacy Policy
              </a>
            </li>
            <li>
              <a className="hover:text-white" href="#">
                Cookies
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
