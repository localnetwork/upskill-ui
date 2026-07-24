import BaseApi from "../_base.api";

export default class COMMUNICATIONAPI {
  static async getInstructorCourses() {
    return BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/communication/instructor/courses`);
  }

  static async getInstructorQa(params = {}) {
    return BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/communication/instructor/qa`, {
      params,
    });
  }

  static async getInstructorAiInsights() {
    return BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/communication/instructor/ai-insights`);
  }

  static async getInstructorMessages(params = {}) {
    return BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/communication/instructor/messages`,
      { params },
    );
  }

  static async getInstructorAssignments() {
    return BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/communication/instructor/assignments`);
  }

  static async getAnnouncementDraft() {
    return BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/communication/instructor/announcements/draft`,
    );
  }

  static async getAnnouncements(params = {}) {
    return BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/communication/instructor/announcements`,
      { params },
    );
  }

  static async saveAnnouncementDraft(payload) {
    return BaseApi.post(
      `${process.env.NEXT_PUBLIC_API_URL}/communication/instructor/announcements/draft`,
      payload,
    );
  }

  static async sendAnnouncement(payload) {
    return BaseApi.post(
      `${process.env.NEXT_PUBLIC_API_URL}/communication/instructor/announcements/send`,
      payload,
    );
  }
}
