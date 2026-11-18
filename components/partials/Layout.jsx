import Header from "./Header";
import toast, { Toaster } from "react-hot-toast";
import Modal from "./modals/Modal";
import modalState from "@/lib/store/modalState";
import globalStore from "@/lib/store/globalStore";
import Footer from "./Footer";
import LearnerAIWidget from "./LearnerAIWidget";
import { useRouter } from "next/router";
import OfflineProvider from "./OfflineProvider";
import SecureAccountReminder from "./SecureAccountReminder";
import MobileBottomNav from "./MobileBottomNav";

export default function Layout({ children }) {
  const modalInfo = modalState((state) => state.modalInfo);
  const router = useRouter();
  const isCallRoute = /^\/(messages\/call|instructor\/courses\/\[slug\]\/role-play)/.test(
    String(router.pathname || ""),
  );

  const hasMobileActionBar = globalStore((state) => state.mobileActionBar);
  return (
    <div
      className={`flex flex-col min-h-screen ${
        hasMobileActionBar ? "pb-44 lg:pb-0" : "pb-16 md:pb-0"
      }`}
    >
      {!isCallRoute ? <Header /> : null}
      <main className="grow">{children}</main>

      <Toaster position="top-right" reverseOrder={false} />
      <OfflineProvider />
      {!isCallRoute ? <SecureAccountReminder /> : null}
      {!isCallRoute ? <Footer /> : null}
      {!isCallRoute ? <MobileBottomNav /> : null}
      {modalInfo && <Modal />}
    </div>
  );
}
