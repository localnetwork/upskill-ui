import BaseApi from "../_base.api";

export default class COURSEREPORTAPI {
  static async create(payload) {
    return BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/course-reports`, payload);
  }
}
