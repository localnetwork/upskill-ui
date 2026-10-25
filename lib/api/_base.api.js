import axios from "axios";
import interceptorSetup from "./interceptor";
import UseSWR from "swr";
import { mutateOrQueue } from "@/lib/offline/queue";

// Attach interceptors to the global axios instance
interceptorSetup(axios);

// A clean axios instance with NO interceptors (optional use)
const basicAxios = axios.create();

export default class BaseApi {
  static async get(url, config = {}) {
    return axios.get(url, config);
  }

  // Writes are stored and replayed when the connection returns (see lib/offline/queue.js).
  static async post(url, data = {}, config = {}) {
    return mutateOrQueue("post", url, data, config);
  }

  static async put(url, data = {}, config = {}) {
    return mutateOrQueue("put", url, data, config);
  }

  static async patch(url, data = {}, config = {}) {
    return mutateOrQueue("patch", url, data, config);
  }

  static async delete(url, config = {}) {
    return mutateOrQueue("delete", url, undefined, config);
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
      options,
    );

    return {
      data,
      mutate,
      isValidating,
      error,
    };
  }

  static swrPost(URL, payload, options = {}) {
    const fetcher = (link) => axios.post(link, payload);
    const render = options.hasOwnProperty("render") ? options.render : true;
    const { data, mutate, isValidating, error } = UseSWR(
      render ? URL : null,
      fetcher,
      options,
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
