import Header from "./Header";
import toast, { Toaster } from "react-hot-toast";
import Modal from "./modals/Modal";
import modalState from "@/lib/store/modalState";
import Footer from "./Footer";
import LearnerAIWidget from "./LearnerAIWidget";
import { useRouter } from "next/router";
import OfflineProvider from "./OfflineProvider";
import SecureAccountReminder from "./SecureAccountReminder";

export default function Layout({ children }) {
  const modalInfo = modalState((state) => state.modalInfo);
  const router = useRouter();
  const isCallRoute = /^\/(messages\/call|instructor\/courses\/\[slug\]\/role-play)/.test(
    String(router.pathname || ""),
  );

  return (
    <div className="flex flex-col min-h-screen">
      {!isCallRoute ? <Header /> : null}
      <main className="grow">{children}</main>

      <Toaster position="top-right" reverseOrder={false} />
      <OfflineProvider />
      {!isCallRoute ? <SecureAccountReminder /> : null}
      {!isCallRoute ? <Footer /> : null}
      {modalInfo && <Modal />}
    </div>
  );
}
