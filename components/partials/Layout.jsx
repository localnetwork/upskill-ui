import Header from "./Header";
import toast, { Toaster } from "react-hot-toast";
import Modal from "./modals/Modal";
import modalState from "@/lib/store/modalState";
import Footer from "./Footer";
export default function Layout({ children }) {
  const modalInfo = modalState((state) => state.modalInfo);
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="grow">{children}</main>

      <Toaster position="top-right" reverseOrder={false} />
      <Footer />
      {modalInfo && <Modal />}
    </div>
  );
}
