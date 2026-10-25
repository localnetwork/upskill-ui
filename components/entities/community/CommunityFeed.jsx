import { useCallback, useEffect, useRef, useState } from "react";
import {
  Heart,
  ImagePlus,
  MessageCircle,
  Pin,
  Flag,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import COMMUNITYAPI from "@/lib/api/community/request";
import { confirmModal } from "@/lib/services/confirm";
import persistentStore from "@/lib/store/persistentStore";
import UserAvatar from "@/components/entities/user/UserAvatar";
import { Avatar, RoleBadge, timeAgo, errorMessage } from "./CommunityShared";

function Comments({ post, me, isStaff, onCountChange, onReport, mediaIndex = null }) {
  const [items, setItems] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    setItems(null);
    setReplyTo(null);
    COMMUNITYAPI.comments(post.id, mediaIndex)
      .then((res) => setItems(res?.data?.data || []))
      .catch((e) => {
        setItems([]);
        toast.error(errorMessage(e, "Failed to load comments"));
      });
  }, [post.id, mediaIndex]);

  const submit = async (event) => {
    event.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await COMMUNITYAPI.createComment(post.id, text.trim(), replyTo?.id, mediaIndex);
      setItems((prev) => [...(prev || []), res?.data?.data]);
      setText("");
      setReplyTo(null);
      onCountChange(1);
    } catch (e) {
      toast.error(errorMessage(e, "Failed to comment"));
    } finally {
      setSending(false);
    }
  };

  const remove = async (comment) => {
    const ok = await confirmModal({
      title: "Delete comment?",
      message: "This comment will be removed.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await COMMUNITYAPI.deleteComment(comment.id);
      const removed = items.filter((c) => c.id === comment.id || c.parentId === comment.id).length;
      setItems((prev) => prev.filter((c) => c.id !== comment.id && c.parentId !== comment.id));
      onCountChange(-removed);
    } catch (e) {
      toast.error(errorMessage(e, "Failed to delete comment"));
    }
  };

  const renderComment = (c, isReply) => (
    <div key={c.id} className={`flex gap-2 ${isReply ? "ml-10 mt-2" : ""}`}>
      <Avatar user={c.author} size={isReply ? 28 : 32} />
      <div className="min-w-0 flex-1">
        <div className="inline-block max-w-full rounded-2xl bg-slate-100 px-3 py-2">
          <p className="text-sm font-semibold">{c.author?.name}</p>
          <p className="whitespace-pre-wrap break-words text-sm">{c.body}</p>
        </div>
        <div className="mt-0.5 flex gap-3 px-2 text-xs text-slate-500">
          <span>{timeAgo(c.createdAt)}</span>
          <button
            type="button"
            onClick={() => setReplyTo({ id: c.id, name: c.author?.name })}
            className="hover:text-slate-900"
          >
            Reply
          </button>
          {c.author?.id !== me && (
            <button
              type="button"
              onClick={() => onReport({ targetType: "COMMENT", targetId: c.id })}
              className="hover:text-red-600"
            >
              Report
            </button>
          )}
          {(c.author?.id === me || isStaff) && (
            <button type="button" onClick={() => remove(c)} className="hover:text-red-600">
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
      {items === null ? (
        <p className="text-sm text-slate-400">Loading comments…</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center text-slate-500">
          <FileText size={56} strokeWidth={1.5} className="text-slate-400" />
          <p className="mt-3 text-base font-bold text-slate-600">No comments yet</p>
          <p className="text-sm">Be the first to comment.</p>
        </div>
      ) : (
        items
          .filter((c) => !c.parentId)
          .map((c) => (
            <div key={c.id}>
              {renderComment(c, false)}
              {items.filter((r) => r.parentId === c.id).map((r) => renderComment(r, true))}
            </div>
          ))
      )}
      {replyTo ? (
        <p className="flex items-center gap-2 px-2 text-xs text-slate-500">
          Replying to {replyTo.name}
          <button type="button" onClick={() => setReplyTo(null)} className="font-semibold hover:text-slate-900">
            Cancel
          </button>
        </p>
      ) : null}
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          placeholder={replyTo ? "Write a reply…" : "Write a comment…"}
          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--cm)" }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

function PostSkeletons({ count = 3 }) {
  return Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      aria-hidden="true"
      className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded bg-slate-200" />
          <div className="h-2.5 w-1/5 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-slate-200" />
        <div className="h-3 w-11/12 rounded bg-slate-200" />
        <div className="h-3 w-2/3 rounded bg-slate-200" />
      </div>
      {i % 2 === 0 ? <div className="mt-4 h-48 w-full rounded-lg bg-slate-200" /> : null}
      <div className="mt-4 flex gap-5 border-t border-slate-100 pt-3">
        <div className="h-4 w-12 rounded bg-slate-200" />
        <div className="h-4 w-12 rounded bg-slate-200" />
      </div>
    </div>
  ));
}

const MAX_ZOOM = 4;

function PostViewer({ post, me, isStaff, initialIndex = 0, onClose, onIndexChange, onLike, onReport, onCountChange }) {
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(0);
  const imgRef = useRef(null);
  const zoomBy = (dir) => {
    if (zoom === 1 && imgRef.current) setFitWidth(imgRef.current.getBoundingClientRect().width);
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(1, z + dir * 0.5)));
  };
  const images = post.imageUrls?.length ? post.imageUrls : post.imageUrl ? [post.imageUrl] : [];
  const multiple = images.length > 1;
  const [index, setIndex] = useState(Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0)));
  const go = useCallback(
    (delta) => {
      setZoom(1);
      setIndex((i) => (i + delta + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (multiple && e.target?.tagName !== "INPUT") {
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, go, multiple]);

  const hasMedia = images.length > 0;
  useEffect(() => {
    if (multiple) onIndexChange?.(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, multiple]);

  return (
    <div
      className={
        hasMedia
          ? "fixed inset-0 z-[90] flex flex-col bg-black lg:flex-row"
          : "fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
      }
      onMouseDown={(e) => {
        if (!hasMedia && e.target === e.currentTarget) onClose();
      }}
    >
      {hasMedia ? (
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 flex overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={images[index]}
            alt=""
            draggable={false}
            className={`m-auto ${zoom > 1 ? "cursor-zoom-out" : "max-h-full max-w-full cursor-zoom-in object-contain"}`}
            style={
              zoom > 1 && fitWidth
                ? { width: fitWidth * zoom, maxWidth: "none", maxHeight: "none", height: "auto" }
                : undefined
            }
            onClick={() => (zoom > 1 ? setZoom(1) : zoomBy(1))}
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute left-3 top-3 z-10 rounded-full bg-slate-200 p-2.5 text-slate-700 hover:bg-white"
        >
          <X size={22} />
        </button>
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          <button
            type="button"
            onClick={() => zoomBy(1)}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
            className="rounded-full bg-white/20 p-2.5 text-white hover:bg-white/30 disabled:opacity-40"
          >
            <ZoomIn size={20} />
          </button>
          <button
            type="button"
            onClick={() => zoomBy(-1)}
            disabled={zoom <= 1}
            aria-label="Zoom out"
            className="rounded-full bg-white/20 p-2.5 text-white hover:bg-white/30 disabled:opacity-40"
          >
            <ZoomOut size={20} />
          </button>
        </div>
        {multiple ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2.5 text-white hover:bg-white/30"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2.5 text-white hover:bg-white/30"
            >
              <ChevronRight size={24} />
            </button>
            <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
              {index + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>
      ) : null}
      <aside
        className={
          hasMedia
            ? "flex max-h-[55vh] w-full flex-col bg-white lg:max-h-none lg:w-[360px] lg:shrink-0"
            : "relative flex max-h-[85vh] w-full max-w-xl flex-col rounded-xl bg-white shadow-2xl"
        }
      >
        {!hasMedia ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 rounded-full bg-slate-200 p-2 text-slate-700 hover:bg-slate-300"
          >
            <X size={20} />
          </button>
        ) : null}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-start gap-3">
            <Avatar user={post.author} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{post.author?.name}</span>
                <RoleBadge role={post.author?.role} badge={post.author?.badge} />
              </div>
              <p className="text-xs text-slate-500">{timeAgo(post.createdAt)}</p>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-wrap break-words">{post.body}</p>
          <div className="mt-3 flex items-center gap-5 border-b border-slate-100 pb-2 text-sm text-slate-600">
            <button
              type="button"
              onClick={onLike}
              className="flex items-center gap-1.5 hover:text-red-500"
            >
              <Heart
                size={18}
                className={post.likedByMe ? "fill-red-500 text-red-500" : ""}
              />
              {post.likeCount}
            </button>
            <span className="flex items-center gap-1.5">
              <MessageCircle size={18} />
              {post.commentCount}
            </span>
          </div>
          <Comments
            post={post}
            me={me}
            isStaff={isStaff}
            onReport={onReport}
            onCountChange={onCountChange}
            mediaIndex={multiple ? index : null}
          />
        </div>
      </aside>
    </div>
  );
}

function PostCard({ post, slug, me, isStaff, onChange, onRemove, onReport, deepLink }) {
  const [showComments, setShowComments] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);
  const viewerOpen = viewerIndex !== null;
  const own = post.author?.id === me;
  const articleRef = useRef(null);
  const handledLink = useRef(null);
  const router = useRouter();
  const images = post.imageUrls?.length ? post.imageUrls : post.imageUrl ? [post.imageUrl] : [];

  const syncUrl = (media) => {
    const query = { ...router.query, post: post.id };
    delete query.media;
    if (media != null) query.media = String(media);
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  };

  const openViewer = (i) => {
    setViewerIndex(i);
    syncUrl(images.length > 1 ? i : null);
  };

  const closeViewer = () => {
    setViewerIndex(null);
    const query = { ...router.query };
    delete query.post;
    delete query.media;
    delete query.set;
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  };

  useEffect(() => {
    if (!deepLink) {
      handledLink.current = null;
      return;
    }
    if (handledLink.current === deepLink.key) return;
    handledLink.current = deepLink.key;
    const media = deepLink.media != null && images[deepLink.media] ? deepLink.media : 0;
    setViewerIndex(media);
    articleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [deepLink, images]);

  const like = async () => {
    onChange({
      ...post,
      likedByMe: !post.likedByMe,
      likeCount: post.likeCount + (post.likedByMe ? -1 : 1),
    });
    try {
      const res = await COMMUNITYAPI.like(post.id);
      const d = res?.data?.data;
      if (d) onChange({ ...post, likedByMe: d.liked, likeCount: d.likeCount });
    } catch (e) {
      onChange(post);
      toast.error(errorMessage(e, "Failed to react"));
    }
  };

  const togglePin = async () => {
    try {
      await COMMUNITYAPI.pinPost(post.id, !post.pinned);
      onChange({ ...post, pinned: !post.pinned }, true);
    } catch (e) {
      toast.error(errorMessage(e, "Failed to pin"));
    }
  };

  const remove = async () => {
    const ok = await confirmModal({
      title: "Delete post?",
      message: "This post and its comments will be removed.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await COMMUNITYAPI.deletePost(post.id);
      onRemove(post.id);
    } catch (e) {
      toast.error(errorMessage(e, "Failed to delete"));
    }
  };

  return (
    <article ref={articleRef} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {post.pinned ? (
        <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-500">
          <Pin size={12} /> Pinned
        </p>
      ) : null}
      <header className="flex items-start gap-3">
        <Avatar user={post.author} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{post.author?.name}</span>
            <RoleBadge role={post.author?.role} badge={post.author?.badge} />
          </div>
          <p className="text-xs text-slate-500">{timeAgo(post.createdAt)}</p>
        </div>
        <div className="flex gap-1 text-slate-400">
          {isStaff ? (
            <button
              type="button"
              title={post.pinned ? "Unpin" : "Pin"}
              onClick={togglePin}
              className="rounded p-1 hover:bg-slate-100"
            >
              <Pin size={16} />
            </button>
          ) : null}
          {!own ? (
            <button
              type="button"
              title="Report"
              onClick={() =>
                onReport({ targetType: "POST", targetId: post.id })
              }
              className="rounded p-1 hover:bg-slate-100"
            >
              <Flag size={16} />
            </button>
          ) : null}
          {own || isStaff ? (
            <button
              type="button"
              title="Delete"
              onClick={remove}
              className="rounded p-1 hover:bg-slate-100 hover:text-red-600"
            >
              <Trash2 size={16} />
            </button>
          ) : null}
        </div>
      </header>
      <p className="mt-3 whitespace-pre-wrap break-words">{post.body}</p>
      {images.length === 1 ? (
        <button
          type="button"
          onClick={() => openViewer(0)}
          className="mt-3 block w-full cursor-zoom-in"
          aria-label="Open photo"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[0]}
            alt=""
            className="max-h-[460px] w-full rounded-lg object-cover"
          />
        </button>
      ) : images.length > 1 ? (
        <div className="mt-3 grid grid-cols-2 gap-1 overflow-hidden rounded-lg">
          {images.slice(0, 4).map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => openViewer(i)}
              aria-label={`Open photo ${i + 1}`}
              className={`relative cursor-zoom-in ${images.length === 3 && i === 0 ? "col-span-2" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-52 w-full object-cover" />
              {i === 3 && images.length > 4 ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-2xl font-semibold text-white">
                  +{images.length - 4}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
      {viewerOpen ? (
        <PostViewer
          post={post}
          me={me}
          isStaff={isStaff}
          initialIndex={viewerIndex}
          onClose={closeViewer}
          onIndexChange={(i) => syncUrl(i)}
          onLike={like}
          onReport={onReport}
          onCountChange={(delta) =>
            onChange({
              ...post,
              commentCount: Math.max(0, post.commentCount + delta),
            })
          }
        />
      ) : null}
      <div className="mt-3 flex items-center gap-5 border-t border-slate-100 pt-2 text-sm text-slate-600">
        <button
          type="button"
          onClick={like}
          className="flex items-center gap-1.5 hover:text-red-500"
        >
          <Heart
            size={18}
            className={post.likedByMe ? "fill-red-500 text-red-500" : ""}
          />
          {post.likeCount}
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 hover:text-slate-900"
        >
          <MessageCircle size={18} />
          {post.commentCount}
        </button>
      </div>
      {showComments ? (
        <Comments
          post={post}
          me={me}
          isStaff={isStaff}
          onReport={onReport}
          onCountChange={(delta) =>
            onChange({
              ...post,
              commentCount: Math.max(0, post.commentCount + delta),
            })
          }
        />
      ) : null}
    </article>
  );
}

function ReportDialog({ target, slug, onClose }) {
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  if (!target) return null;
  const submit = async () => {
    if (!reason.trim() || sending) return;
    setSending(true);
    try {
      await COMMUNITYAPI.report(slug, { ...target, reason: reason.trim() });
      toast.success("Report sent to the moderators");
      setReason("");
      onClose();
    } catch (e) {
      toast.error(errorMessage(e, "Failed to report"));
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5">
        <h3 className="text-lg font-semibold">
          Report {target.targetType === "POST" ? "post" : "comment"}
        </h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="Why are you reporting this?"
          className="mt-3 w-full rounded-lg border border-slate-200 p-3 text-sm"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!reason.trim() || sending}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--cm)" }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommunityFeed({ slug, me, role }) {
  const isStaff = role === "ADMIN" || role === "MODERATOR";
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const router = useRouter();
  const [deepPost, setDeepPost] = useState(null);
  const linkedPostId = typeof router.query.post === "string" ? router.query.post : null;
  const linkedMedia = router.query.media !== undefined ? Number(router.query.media) : null;
  const profile = persistentStore((state) => state.profile);
  const fullName = [profile?.firstname, profile?.lastname]
    .filter(Boolean)
    .join(" ");
  const [reportTarget, setReportTarget] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(
    async (nextCursor) => {
      setLoading(true);
      try {
        const res = await COMMUNITYAPI.posts(
          slug,
          nextCursor ? { cursor: nextCursor } : {},
        );
        const data = res?.data?.data;
        setPosts((prev) =>
          nextCursor ? [...prev, ...data.items] : data.items,
        );
        setCursor(data.nextCursor);
      } catch (e) {
        toast.error(errorMessage(e, "Failed to load posts"));
      } finally {
        setLoading(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    load(null);
  }, [load]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!linkedPostId) setDeepPost(null);
  }, [router.isReady, linkedPostId]);

  useEffect(() => {
    if (!linkedPostId || loading) return;
    const key = `${linkedPostId}:${linkedMedia ?? ""}`;
    if (posts.some((p) => p.id === linkedPostId)) {
      setDeepPost((prev) => (prev?.key === key ? prev : { id: linkedPostId, key, media: Number.isInteger(linkedMedia) ? linkedMedia : null }));
      return;
    }
    let cancelled = false;
    COMMUNITYAPI.getPost(linkedPostId)
      .then((res) => {
        const post = res?.data?.data;
        if (cancelled || !post) return;
        setPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [post, ...prev]));
      })
      .catch(() => toast.error("That post is no longer available"));
    return () => {
      cancelled = true;
    };
  }, [linkedPostId, linkedMedia, loading, posts]);

  const pickImage = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, Math.max(0, 10 - images.length));
    event.target.value = "";
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const res = await COMMUNITYAPI.upload(file);
        const path = res?.data?.data?.path;
        if (path) uploaded.push(path);
      }
      setImages((prev) => [...prev, ...uploaded].slice(0, 10));
    } catch (e) {
      toast.error(errorMessage(e, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!body.trim() || posting || uploading) return;
    setPosting(true);
    try {
      const res = await COMMUNITYAPI.createPost(slug, {
        body: body.trim(),
        imageUrls: images,
      });
      const created = res?.data?.data;
      setPosts((prev) => {
        const pinnedCount = prev.filter((p) => p.pinned).length;
        return [
          ...prev.slice(0, pinnedCount),
          created,
          ...prev.slice(pinnedCount),
        ];
      });
      setBody("");
      setImages([]);
      setComposerOpen(false);
    } catch (e) {
      toast.error(errorMessage(e, "Failed to post"));
    } finally {
      setPosting(false);
    }
  };

  const updatePost = (next, resort) => {
    setPosts((prev) => {
      const mapped = prev.map((p) => (p.id === next.id ? next : p));
      return resort
        ? [
            ...mapped.filter((p) => p.pinned),
            ...mapped.filter((p) => !p.pinned),
          ]
        : mapped;
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <UserAvatar size="sm" className="!border-0" />
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-left text-slate-500 hover:bg-slate-200"
          >
            Write something…
          </button>
        </div>
        <div className="mt-3 border-t border-slate-200 pt-2">
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            <ImagePlus size={22} className="text-green-500" /> Photo
          </button>
        </div>
      </div>

      {composerOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-white/70 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setComposerOpen(false);
          }}
        >
          <form
            onSubmit={submit}
            className="w-full max-w-[500px] rounded-xl bg-white shadow-2xl ring-1 ring-black/5"
          >
            <div className="relative border-b border-slate-200 py-4 text-center">
              <h3 className="text-xl font-bold">Create post</h3>
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                aria-label="Close"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-200 p-2 text-slate-600 hover:bg-slate-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3">
                <UserAvatar size="sm" className="!border-0" />
                <p className="font-semibold">{fullName || "You"}</p>
              </div>
              <textarea
                autoFocus
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={5000}
                rows={5}
                placeholder="Create a post…"
                className="mt-3 w-full resize-none border-0 text-xl outline-none placeholder:text-slate-500"
              />
              {images.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {images.map((src, i) => (
                    <div key={`${src}-${i}`} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-24 w-24 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {images.length < 10 && !uploading ? (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-xs text-slate-500 hover:bg-slate-50"
                    >
                      <ImagePlus size={20} />
                      Add more
                    </button>
                  ) : null}
                  {uploading ? (
                    <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500">
                      Uploading…
                    </div>
                  ) : null}
                </div>
              ) : uploading ? (
                <p className="mt-2 text-sm text-slate-500">Uploading…</p>
              ) : null}
              <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-300 px-4 py-3">
                <span className="font-semibold">Add to your post</span>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  aria-label="Add photo"
                  className="rounded-full p-2 text-green-500 hover:bg-slate-100"
                >
                  <ImagePlus size={24} />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={pickImage}
                />
              </div>
              <button
                type="submit"
                disabled={!body.trim() || posting || uploading}
                className="mt-4 w-full rounded-lg py-2.5 font-semibold text-white disabled:bg-slate-200 disabled:text-slate-400"
                style={{ background: "var(--cm)" }}
              >
                {posting ? "Posting…" : "Post"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          slug={slug}
          me={me}
          isStaff={isStaff}
          onChange={updatePost}
          onRemove={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
          onReport={setReportTarget}
          deepLink={deepPost?.id === post.id ? deepPost : null}
        />
      ))}
      {!loading && posts.length === 0 ? (
        <p className="py-10 text-center text-slate-500">
          No posts yet. Start the conversation!
        </p>
      ) : null}
      {loading ? <PostSkeletons count={posts.length ? 1 : 3} /> : null}
      {cursor && !loading ? (
        <button
          type="button"
          onClick={() => load(cursor)}
          className="mx-auto block rounded-lg border border-slate-300 px-4 py-2 text-sm"
        >
          Load more
        </button>
      ) : null}
      <ReportDialog
        target={reportTarget}
        slug={slug}
        onClose={() => setReportTarget(null)}
      />
    </div>
  );
}
