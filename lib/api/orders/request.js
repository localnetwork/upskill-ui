import BaseApi from "../_base.api";
export default class ORDERAPI {
  static async myLearnings() {
    try {
      const res = await BaseApi.get(process.env.NEXT_PUBLIC_API_URL + "/enrollments");
      return res;
    } catch (err) {
      throw err;
    }
  }

  static async myOrders(params = {}) {
    try {
      return await BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
        params,
      });
    } catch (err) {
      throw err;
    }
  }
}
