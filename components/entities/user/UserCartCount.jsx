import Cart from "@/components/icons/Cart";
import CARTAPI from "@/lib/api/cart/request";
import cartStore from "@/lib/store/cartStore";
import globalStore from "@/lib/store/globalStore";
import persistentStore from "@/lib/store/persistentStore";
import { ShoppingCart } from "lucide-react";
import { useEffect } from "react";
import { mutate } from "swr";
export default function UserCartCount() {
  const count = cartStore((s) => s.cartCount);
  const cart = cartStore((s) => s.cart);
  const profile = persistentStore((s) => s.profile);
  const cartDrawerOpen = globalStore((s) => s.cartDrawerOpen);

  const roleList = Array.isArray(profile?.roles) ? profile.roles : [];
  const isLearner = roleList.includes("LEARNER");

  const isCartLoading = cartStore((s) => s.isCartLoading);

  // ✅ Call the hook returned by the static method
  const { data: cartCount } = CARTAPI.getCartCount({
    render: !!profile && isLearner,
    onSuccess: (data) => {
      cartStore.setState({ cartCount: data?.count });
    },
    onError: (error) => {
      cartStore.setState({ cartCount: 0, cart: null });
    },
  })();

  const {
    data: cartItems,
    mutate: mutateCartItems,
    isLoading,
    isValidating,
  } = CARTAPI.getCartInfo({
    render: !!profile && isLearner,
    onSuccess: (data) => {
      const nextCartTotal =
        data?.data?.cartTotal == null ? null : Number(data.data.cartTotal);
      const currentCoupons = cartStore.getState().appliedCourseCoupons || {};
      const nextCartItems = Array.isArray(data?.data?.cartItems)
        ? data.data.cartItems
        : [];
      const validCourseIds = new Set(
        nextCartItems.map((item) => String(item?.course?.id || "")),
      );
      const filteredCoupons = Object.fromEntries(
        Object.entries(currentCoupons).filter(([courseId]) =>
          validCourseIds.has(String(courseId)),
        ),
      );

      cartStore.setState({
        cart: nextCartItems,
        cartTotal: nextCartTotal,
        appliedCourseCoupons: filteredCoupons,
      });
    },
    onError: () => {
      cartStore.setState({
        cartCount: 0,
        cart: null,
        cartTotal: null,
        appliedCourseCoupons: {},
      });
    },
  })();

  useEffect(() => {
    cartStore.setState({
      isCartLoading: isLoading || isValidating,
    });
  }, [isLoading, isValidating]);

  const handleCartDrawer = () => {
    if (!isLearner) return;
    globalStore.setState({ cartDrawerOpen: !cartDrawerOpen });
    mutate("/cart");
  };

  if (!isLearner) return null;

  return (
    <div
      className="relative inline-flex h-auto select-none cursor-pointer"
      onClick={(e) => handleCartDrawer()}
    >
      <span className="inline-flex max-w-[30px]">
        {/* <Cart /> */}
        <ShoppingCart className="w-6 h-6 text-slate-600" />
      </span>
      <span className="absolute rounded-full w-[20px] h-[20px] flex items-center justify-center -mt-3 right-[-5px] top-[2px] text-[12px] font-bold bg-[#3588FC] text-white px-1">
        {count}
      </span>
    </div>
  );
}
