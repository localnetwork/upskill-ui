import Cart from "@/components/icons/Cart";
import CARTAPI from "@/lib/api/cart/request";
import cartStore from "@/lib/store/cartStore";
import globalStore from "@/lib/store/globalStore";
import persistentStore from "@/lib/store/persistentStore";
import { mutate } from "swr";
export default function UserCartCount() {
  const count = cartStore((s) => s.cartCount);
  const cart = cartStore((s) => s.cart);
  const profile = persistentStore((s) => s.profile);
  const cartDrawerOpen = globalStore((s) => s.cartDrawerOpen);

  // ✅ Call the hook returned by the static method
  const { data: cartCount } = CARTAPI.getCartCount({
    render: !!profile,
    onSuccess: (data) => {
      cartStore.setState({ cartCount: data?.count });
    },
    onError: (error) => {
      cartStore.setState({ cartCount: 0, cart: null });
    },
  })();

  const { data: cartItems, mutate: mutateCartItems } = CARTAPI.getCartInfo({
    render: !!profile,
    onSuccess: (data) => {
      cartStore.setState({
        cart: data?.data.cartItems || [],
        cartTotal: data?.data.cartTotal || null,
      });
    },
    onError: (error) => {
      cartStore.setState({ cartCount: 0, cart: null, cartTotal: null });
    },
  })();

  const handleCartDrawer = () => {
    globalStore.setState({ cartDrawerOpen: !cartDrawerOpen });
    mutate("/cart");
  };

  return (
    <div
      className="relative inline-flex h-auto select-none cursor-pointer"
      onClick={(e) => handleCartDrawer()}
    >
      <span className="inline-flex max-w-[30px]">
        <Cart />
      </span>
      <span className="absolute rounded-full w-[23px] h-[23px] flex items-center justify-center -mt-3 right-[-5px] top-0 text-[14px] font-bold bg-[#3588FC] text-white px-1">
        {count}
      </span>
    </div>
  );
}
