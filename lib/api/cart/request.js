import BaseApi from "../_base.api";

export default class CARTAPI {
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

  static async getCartItems() {
    try {
      const response = await BaseApi.get(
        process.env.NEXT_PUBLIC_API_URL + "/cart"
      );
      return response;
    } catch (error) {
      console.error("Error fetching cart items:", error);
      throw error;
    }
  }

  static getCartCount(options = {}) {
    const url = `/cart/count`;
    return BaseApi.swr(`${process.env.NEXT_PUBLIC_API_URL}${url}`, options);
  }
}
