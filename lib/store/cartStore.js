import { create } from "zustand";

import { devtools, persist } from "zustand/middleware";
let storeHandler = (set, get) => ({
  cart: null,
  cartCount: 0,
  cartTotal: null,
  // cartDrawerOpen: false,
  setCartCount: (count) => set({ cartCount: count }),
});

storeHandler = devtools(storeHandler);
storeHandler = persist(storeHandler, { name: "cart" });
const store = create(storeHandler);
export default store;
