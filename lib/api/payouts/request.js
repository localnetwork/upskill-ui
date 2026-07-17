import BaseApi from "../_base.api";

export default class PAYOUTAPI {
  static getSummary(options = {}) {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/payouts/summary`;
    return BaseApi.swr(url, options);
  }

  static getMyPayouts(params = {}, options = {}) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      query.set(key, String(value));
    });

    const suffix = query.toString() ? `?${query.toString()}` : "";
    const url = `${process.env.NEXT_PUBLIC_API_URL}/payouts/my${suffix}`;
    return BaseApi.swr(url, options);
  }

  static async connectPayoutAccount(payload) {
    return BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/payouts/account`, payload);
  }

  static async requestPayout(payload = {}) {
    return BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/payouts/request`, payload);
  }
}
