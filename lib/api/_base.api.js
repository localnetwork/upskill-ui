import axios from "axios";
import interceptorSetup from "./interceptor";
import UseSWR from "swr";

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

  // Documentation: https://swr.vercel.app/docs/api
  static swr(url, options = {}) {
    const fetcher = async (link) => {
      const res = await this.get(link);
      return res.data; // ✅ clean
    };

    const render = options.hasOwnProperty("render") ? options.render : true;

    const { data, mutate, isValidating, error } = UseSWR(
      render ? url : null,
      fetcher,
      options
    );

    // ✅ trigger onSuccess if provided
    if (options.onSuccess && data) {
      options.onSuccess(data);
    }

    return {
      data,
      mutate,
      isValidating,
      error,
    };
  }

  static swrPost(URL, payload, options = {}) {
    const fetcher = (link) => this.post(link, payload);
    const render = options.hasOwnProperty("render") ? options.render : true;
    const { data, mutate, isValidating, error } = UseSWR(
      render ? URL : null,
      fetcher,
      options
    );
    return {
      data: data ? data.data : data,
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
