import Header from "./Header";
import toast, { Toaster } from "react-hot-toast";
import Modal from "./modals/Modal";
import modalState from "@/lib/store/modalState";
export default function Layout({ children }) {
  const modalInfo = modalState((state) => state.modalInfo);
  return (
    <div>
      <Header />
      <main>{children}</main>

      <Toaster position="top-right" reverseOrder={false} />
      {modalInfo && <Modal />}
    </div>
  );
}
