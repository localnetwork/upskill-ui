import BaseApi from "../_base.api";
export default class PAYOUTACCOUNTAPI {
  static getPayoutAccounts(options = {}) {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/payout-accounts`;
    return BaseApi.swr(url, options);
  }
}
