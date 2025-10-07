import nookies from "nookies";
import persistentStore from "@/lib/store/persistentStore";
export const isLoggedIn = () => {
  const profile = persistentStore.getState().profile;
  const cookies = nookies.get();

  const token = cookies?.[process.env.NEXT_PUBLIC_TOKEN] || null;
  if (typeof window === "undefined") return false;
  return profile && token ? true : false;
};

export const logout = () => {
  persistentStore.setState({ profile: null, cart: null });
  nookies.destroy(null, process.env.NEXT_PUBLIC_TOKEN, { path: "/" });
};
