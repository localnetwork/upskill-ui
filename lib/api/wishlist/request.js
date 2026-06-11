import BaseApi from "../_base.api";

export default class WISHLISTAPI {
  static async list() {
    return BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/wishlist`);
  }

  static async add(courseId) {
    return BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/wishlist`, {
      course_id: courseId,
    });
  }

  static async remove(courseId) {
    return BaseApi.delete(`${process.env.NEXT_PUBLIC_API_URL}/wishlist/${courseId}`);
  }
}

