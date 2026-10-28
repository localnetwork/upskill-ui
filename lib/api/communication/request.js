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

  static async getDiscussionThread(threadId) {
    return BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/discussions/${threadId}`);
  }

  static async replyToDiscussion(threadId, body) {
    return BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/discussions/${threadId}/replies`, {
      body,
    });
  }

  static async setDiscussionResolved(threadId, isResolved) {
    return BaseApi.put(`${process.env.NEXT_PUBLIC_API_URL}/discussions/${threadId}/resolved`, {
      isResolved,
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

  static async getChatMessages(conversationId, params = {}) {
    return BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}/messages`,
      { params },
    );
  }

  static async sendChatMessage(conversationId, body) {
    return BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/chat/messages`, {
      conversationId,
      body,
    });
  }

  static async markChatRead(conversationId) {
    return BaseApi.post(
      `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}/read`,
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
