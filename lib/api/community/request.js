import BaseApi from "../_base.api";

const base = () => `${process.env.NEXT_PUBLIC_API_URL}/communities`;
const course = (slug) => `${base()}/course/${encodeURIComponent(slug)}`;

export default class COMMUNITYAPI {
  static get(slug) {
    return BaseApi.get(course(slug));
  }
  static create(slug, body = {}) {
    return BaseApi.post(course(slug), body);
  }
  static update(slug, body) {
    return BaseApi.patch(course(slug), body);
  }
  static join(slug) {
    return BaseApi.post(`${course(slug)}/join`);
  }
  static leave(slug) {
    return BaseApi.delete(`${course(slug)}/join`);
  }
  static upload(file) {
    const form = new FormData();
    form.append("file", file);
    return BaseApi.post(`${base()}/upload`, form);
  }

  static members(slug, params = {}) {
    return BaseApi.get(`${course(slug)}/members`, { params });
  }
  static updateMember(slug, userId, body) {
    return BaseApi.patch(`${course(slug)}/members/${userId}`, body);
  }
  static ban(slug, userId, reason, days) {
    return BaseApi.post(`${course(slug)}/members/${userId}/ban`, { reason, days: days || null });
  }
  static unban(slug, userId) {
    return BaseApi.delete(`${course(slug)}/members/${userId}/ban`);
  }

  static posts(slug, params = {}) {
    return BaseApi.get(`${course(slug)}/posts`, { params });
  }
  static createPost(slug, body) {
    return BaseApi.post(`${course(slug)}/posts`, body);
  }
  static deletePost(postId) {
    return BaseApi.delete(`${base()}/posts/${postId}`);
  }
  static pinPost(postId, pinned) {
    return BaseApi.post(`${base()}/posts/${postId}/pin`, { pinned });
  }
  static like(postId) {
    return BaseApi.post(`${base()}/posts/${postId}/like`);
  }
  static getPost(postId) {
    return BaseApi.get(`${base()}/posts/${postId}`);
  }
  static comments(postId, mediaIndex) {
    return BaseApi.get(`${base()}/posts/${postId}/comments`, {
      params: mediaIndex != null ? { media: mediaIndex } : {},
    });
  }
  static createComment(postId, body, parentId, mediaIndex) {
    return BaseApi.post(`${base()}/posts/${postId}/comments`, {
      body,
      parentId: parentId || null,
      mediaIndex: mediaIndex ?? null,
    });
  }
  static deleteComment(commentId) {
    return BaseApi.delete(`${base()}/comments/${commentId}`);
  }

  static report(slug, body) {
    return BaseApi.post(`${course(slug)}/reports`, body);
  }
  static reports(slug, params = {}) {
    return BaseApi.get(`${course(slug)}/reports`, { params });
  }
  static resolveReport(slug, reportId, action) {
    return BaseApi.post(`${course(slug)}/reports/${reportId}/resolve`, { action });
  }
}
