import BaseApi from "../_base.api";
export default class CourseAPI {
  static async submitForReview(courseUuid, note = "") {
    try {
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseUuid}/submit`,
        { note },
      );
      return response;
    } catch (error) {
      console.error("Error submitting course for review:", error);
      throw error;
    }
  }

  static async unpublish(courseUuid) {
    try {
      const response = await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseUuid}/unpublish`,
      );
      return response;
    } catch (error) {
      console.error("Error unpublishing course:", error);
      throw error;
    }
  }
}
