import BaseApi from "../_base.api";

export default class MOCKINTERVIEWAPI {
  static async start(payload) {
    return BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/mock-interviews`, payload);
  }

  static async answer(id, answer) {
    return BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/mock-interviews/${id}/answer`, {
      answer,
    });
  }

  static async finish(id) {
    return BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/mock-interviews/${id}/finish`);
  }

  static async list(courseId) {
    return BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/mock-interviews`, {
      params: { courseId },
    });
  }
}
