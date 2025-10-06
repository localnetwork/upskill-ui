import Cart from "@/components/icons/Cart";
import CARTAPI from "@/lib/api/cart/request";
import cartStore from "@/lib/store/cartStore";
import persistentStore from "@/lib/store/persistentStore";

export default function UserCartCount() {
  const count = cartStore((state) => state.cartCount);
  const profile = persistentStore((state) => state.profile);

  // ✅ use your static method (hook inside works fine)
  const { data: cartCount, mutate } = CARTAPI.getCartCount({
    render: !!profile, // only run if logged in
    revalidateOnFocus: true,
    refreshInterval: 10000, // optional auto-refresh every 10s
    onSuccess: (data) => {
      cartStore.setState({ cartCount: data?.count });
    },
  });

  return (
    <>
      <Cart />
      <span className="absolute -mt-2 right-0 text-[12px] font-bold bg-red-600 text-white rounded-full px-1">
        {count}
      </span>
    </>
  );
}
