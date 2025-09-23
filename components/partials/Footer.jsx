import React from "react";

const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div className="flex justify-between items-center py-4">
          <div className="text-sm">© 2023 Upskill UI. All rights reserved.</div>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <a href="/privacy" className="hover:underline">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:underline">
                  Terms of Service
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
