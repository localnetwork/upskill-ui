import Header from "./Header";
import toast, { Toaster } from "react-hot-toast";
export default function Layout({ children }) {
  return (
    <div>
      <Header />
      <main>{children}</main>

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}
