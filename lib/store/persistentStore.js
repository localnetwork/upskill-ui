import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
let storeHandler = (set, get) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
});
storeHandler = devtools(storeHandler);
storeHandler = persist(storeHandler, {
  name: "persistent",
  storage: createJSONStorage(() =>
    typeof window !== "undefined" ? localStorage : undefined,
  ),
});
const store = create(storeHandler);
export default store;
