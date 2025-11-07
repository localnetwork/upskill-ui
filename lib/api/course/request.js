import BaseApi from "../_base.api";
export default class CourseAPI {
  static async unpublish(courseUuid) {
    try {
      const response = await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseUuid}/unpublish`
      );
      return response;
    } catch (error) {
      console.error("Error unpublishing course:", error);
      throw error;
    }
  }
}
