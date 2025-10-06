import { create } from "zustand";

import { devtools, persist } from "zustand/middleware";
let storeHandler = (set, get) => ({
  cartItems: null,
  cartCount: 0,
  cartDrawerOpen: false,
  setCartCount: (count) => set({ cartCount: count }),
});

storeHandler = devtools(storeHandler);
storeHandler = persist(storeHandler, { name: "cart" });
const store = create(storeHandler);
export default store;
