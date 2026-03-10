import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
let storeHandler = (set, get) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
});
storeHandler = devtools(storeHandler);
storeHandler = persist(storeHandler, { name: "persistent" });
const store = create(storeHandler);
export default store;
