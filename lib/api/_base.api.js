import axios from "axios";
import interceptorSetup from "./interceptor";
import useSWR from "swr";

interceptorSetup(axios);

// an axios instance WITHOUT interceptors (optional)
const basicAxios = axios.create();

export default class BaseApi {
  /** Generic GET */
  static async get(URL, config = {}) {
    return axios.get(URL, config);
  }

  /** POST with optional config (needed for onUploadProgress) */
  static async post(URL, data = {}, config = {}) {
    return axios.post(URL, data, config);
  }

  static async put(URL, data = {}, config = {}) {
    return axios.put(URL, data, config);
  }

  static async patch(URL, data = {}, config = {}) {
    return axios.patch(URL, data, config);
  }

  static async delete(URL, config = {}) {
    return axios.delete(URL, config);
  }

  /**
   * SWR helper
   * Usage:
   *   const { data, mutate } = BaseApi.swr('/api/foo')
   */
  static swr(URL, options = {}) {
    const fetcher = (link) => this.get(link).then((r) => r.data);
    const shouldFetch = options.hasOwnProperty("render")
      ? options.render
      : true;

    const { data, mutate, isValidating, error } = useSWR(
      shouldFetch ? URL : null,
      fetcher,
      options
    );

    return {
      data,
      mutate,
      isValidating,
      error,
    };
  }

  // Requests WITHOUT interceptors
  static async customGet(URL, config = {}) {
    return basicAxios.get(URL, config);
  }

  static async customPut(URL, data = {}, config = {}) {
    return basicAxios.put(URL, data, config);
  }
}
