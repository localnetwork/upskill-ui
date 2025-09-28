import axios from "axios";
import interceptorSetup from "./interceptor";
import useSWR from "swr";

// Attach interceptors to the global axios instance
interceptorSetup(axios);

// A clean axios instance with NO interceptors (optional use)
const basicAxios = axios.create();

export default class BaseApi {
  static async get(url, config = {}) {
    return axios.get(url, config);
  }

  static async post(url, data = {}, config = {}) {
    return axios.post(url, data, config);
  }

  static async put(url, data = {}, config = {}) {
    return axios.put(url, data, config);
  }

  static async patch(url, data = {}, config = {}) {
    return axios.patch(url, data, config);
  }

  static async delete(url, config = {}) {
    return axios.delete(url, config);
  }

  /**
   * SWR helper
   * Usage:
   *   const { data, mutate } = BaseApi.swr('/api/foo')
   */
  static swr(url, options = {}) {
    const fetcher = (link) => this.get(link).then((res) => res.data);
    const shouldFetch = options.hasOwnProperty("render")
      ? options.render
      : true;

    const { data, mutate, isValidating, error } = useSWR(
      shouldFetch ? url : null,
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
  static async customGet(url, config = {}) {
    return basicAxios.get(url, config);
  }

  static async customPut(url, data = {}, config = {}) {
    return basicAxios.put(url, data, config);
  }
}
