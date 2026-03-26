import BaseApi from "../_base.api";
const fetcher = (url) => fetch(url).then((res) => res.json());
export default class PAYOUTACCOUNTAPI {
  static async connectPayPal(paypalEmail, paypalAccountId) {
    try {
      const res = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/payout-accounts/paypal",
        {
          email: paypalEmail,
          accountId: paypalAccountId,
        },
      );
      return res;
    } catch (err) {
      throw err;
    }
  }

  static getPayoutAccounts(options = {}) {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/payout-accounts`;
    return BaseApi.swr(url, fetcher, options); // returns { data, error, isLoading }
  }
}
