import { create } from "zustand";
export default create(() => ({
  showLazy: false,
  cartDrawerOpen: false,
  mobileNavOpen: false,
  mobileActionBar: false,
  unreadNotifications: 0,
  unreadChats: 0,
  modalInfo: null,
}));
