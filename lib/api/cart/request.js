// ✅ CARTAPI.js
import BaseApi from "../_base.api";

export default class CARTAPI {
  // ✅ Keep async method as normal
  static async addToCart(payload) {
    try {
      const response = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/cart",
        payload
      );
      return response;
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  }

  // ✅ Return a hook function, not call it directly
  static getCartItems(options) {
    const url = `/cart`;
    return function useCartItems() {
      return BaseApi.swr(`${process.env.NEXT_PUBLIC_API_URL}${url}`, options);
    };
  }

  static getCartCount(options) {
    const url = `/cart/count`;
    return function useCartCount() {
      return BaseApi.swr(`${process.env.NEXT_PUBLIC_API_URL}${url}`, options);
    };
  }

  static async removeItem(id) {
    try {
      const response = await BaseApi.delete(
        process.env.NEXT_PUBLIC_API_URL + `/cart/${id}`
      );
      return response;
    } catch (error) {
      console.error("Error removing item from cart:", error);
      throw error;
    }
  }
}
