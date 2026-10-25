import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { FileText, Lock, Users } from "lucide-react";
import COMMUNITYAPI from "@/lib/api/community/request";
import { confirmModal } from "@/lib/services/confirm";
import CommunityFeed from "./CommunityFeed";
import CommunitySettings from "./CommunitySettings";
import { MembersPanel, ReportsPanel } from "./CommunityPanels";
import { errorMessage, Avatar } from "./CommunityShared";

function PrivatePlaceholder({ title = "This group is private", message, courseHref, className = "" }) {
  return (
    <div className={`flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center ${className}`}>
      <div className="relative h-20 w-20">
        <FileText size={80} strokeWidth={1.25} className="text-blue-300" />
        <span className="absolute -bottom-1 -left-3 flex h-10 w-10 items-center justify-center rounded-md bg-slate-600 text-white">
          <Lock size={22} />
        </span>
      </div>
      <p className="mt-5 text-xl font-bold text-slate-600">{title}</p>
      <p className="text-slate-500">{message}</p>
      {courseHref ? (
        <Link href={courseHref} className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white">
          View course
        </Link>
      ) : null}
    </div>
  );
}

export default function CommunityView({ slug, allowSettings = false, courseHref }) {
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("discussion");
  const [busy, setBusy] = useState(false);
  const [showFullAbout, setShowFullAbout] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await COMMUNITYAPI.get(slug);
      setState(res?.data?.data);
      setError("");
    } catch (e) {
      setError(errorMessage(e, "Failed to load community"));
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn, success) => {
    setBusy(true);
    try {
      const res = await fn();
      if (success) toast.success(success);
      const data = res?.data?.data;
      if (data?.community !== undefined) setState(data);
      else await load();
    } catch (e) {
      toast.error(errorMessage(e, "Action failed"));
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    const ok = await confirmModal({
      title: "Leave community?",
      message: "You can join again any time.",
      confirmText: "Leave",
      variant: "danger",
    });
    if (ok) {
      await act(() => COMMUNITYAPI.leave(slug), "You left the community");
    }
  };

  if (error) {
    return <PrivatePlaceholder title="This group isn't available" message={error} courseHref={courseHref} />;
  }
  if (!state) return <p className="py-10 text-center text-slate-400">Loading community…</p>;

  if (!state.community) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <Users className="mx-auto text-slate-400" size={40} />
        {state.canCreate ? (
          <>
            <h2 className="mt-3 text-xl font-semibold">Create a community for your learners</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              A group space where enrolled learners can post, comment and help each other. You will be the admin.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => act(() => COMMUNITYAPI.create(slug), "Community created")}
              className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Create community
            </button>
          </>
        ) : (
          <p className="mt-3 text-slate-600">The instructor has not created a community for this course yet.</p>
        )}
      </div>
    );
  }

  const { community, role, joined, banned, me, restricted, recentMembers = [], recentMedia = [] } = state;
  const isStaff = role === "ADMIN" || role === "MODERATOR";
  const tabs = restricted
    ? [{ id: "discussion", label: "Discussion" }]
    : [
        { id: "discussion", label: "Discussion" },
        { id: "members", label: "Members" },
        ...(isStaff ? [{ id: "reports", label: "Reports" }] : []),
        ...(allowSettings && role === "ADMIN" ? [{ id: "settings", label: "Settings" }] : []),
      ];
  const activeTab = tabs.some((t) => t.id === tab) ? tab : "discussion";
  const showSidebar = (restricted || (joined && !banned)) && activeTab === "discussion";
  const description = community.description || "";
  const longDescription = description.length > 160;

  return (
    <div style={{ "--cm": community.themeColor }} className="mx-auto w-full max-w-6xl space-y-4">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="h-40 w-full sm:h-56" style={{ background: community.coverUrl ? undefined : "var(--cm)" }}>
          {community.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={community.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="flex flex-wrap items-end gap-4 px-5 pb-4">
          <div className="-mt-10 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-200">
            {community.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={community.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white" style={{ background: "var(--cm)" }}>
                <Users size={36} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-3">
            <h1 className="break-words text-2xl font-bold">{community.name}</h1>
            <p className="text-sm text-slate-500">
              {community.memberCount.toLocaleString()} {community.memberCount === 1 ? "member" : "members"} · {community.postCount} posts
            </p>
            {recentMembers.length > 0 ? (
              <div className="mt-2 flex items-center">
                {recentMembers.map((m, i) => (
                  <span key={m.id} title={m.name} className={`rounded-full border-2 border-white ${i === 0 ? "" : "-ml-2"}`}>
                    <Avatar user={m} size={32} />
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          {restricted ? (
            courseHref ? (
              <Link href={courseHref} className="rounded-lg px-5 py-2 text-sm font-semibold text-white" style={{ background: "var(--cm)" }}>
                View course
              </Link>
            ) : null
          ) : role !== "ADMIN" && !banned ? (
            joined ? (
              <button type="button" disabled={busy} onClick={leave} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">
                Joined ✓
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => act(() => COMMUNITYAPI.join(slug), "Welcome to the community!")}
                className="rounded-lg px-5 py-2 text-sm font-semibold text-white"
                style={{ background: "var(--cm)" }}
              >
                Join community
              </button>
            )
          ) : null}
        </div>
        <nav className="flex gap-1 border-t border-slate-100 px-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === t.id ? "text-slate-900" : "border-transparent text-slate-500"}`}
              style={activeTab === t.id ? { borderColor: "var(--cm)" } : undefined}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {banned ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          You have been banned from this community.
        </p>
      ) : !joined && !restricted ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Join the community to see posts and take part in the discussion.
        </p>
      ) : (
        <div className={showSidebar ? "grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]" : ""}>
          <div className="min-w-0">
            {restricted ? (
              <PrivatePlaceholder
                message="Enroll in this course to view or participate in discussions."
                courseHref={courseHref}
              />
            ) : null}
            {!restricted && activeTab === "discussion" ? <CommunityFeed slug={slug} me={me} role={role} /> : null}
            {activeTab === "members" ? <MembersPanel slug={slug} me={me} role={role} /> : null}
            {activeTab === "reports" ? <ReportsPanel slug={slug} /> : null}
            {activeTab === "settings" ? (
              <CommunitySettings slug={slug} community={community} onSaved={(data) => data && setState(data)} />
            ) : null}
          </div>
          {showSidebar ? (
            <aside className="space-y-4 lg:sticky lg:top-4">
              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="text-lg font-bold">About</h2>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">
                  {description
                    ? longDescription && !showFullAbout
                      ? `${description.slice(0, 160)}… `
                      : description
                    : "No description yet."}
                  {longDescription ? (
                    <button type="button" onClick={() => setShowFullAbout((v) => !v)} className="ml-1 font-semibold text-slate-900">
                      {showFullAbout ? "See less" : "See more"}
                    </button>
                  ) : null}
                </p>
                <div className="mt-3 flex gap-3 text-sm">
                  <Lock size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Course learners only</p>
                    <p className="text-slate-500">Only learners enrolled in this course can join and post.</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-3 text-sm">
                  <Users size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">{community.memberCount.toLocaleString()} members</p>
                    <p className="text-slate-500">{community.postCount} posts so far.</p>
                  </div>
                </div>
              </section>
              {!restricted ? (
              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="text-lg font-bold">Recent media</h2>
                {recentMedia.length > 0 ? (
                  <div className="mt-3 grid grid-cols-2 gap-1.5">
                    {recentMedia.map((m) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={m.id} src={m.imageUrl} alt="" className="aspect-square w-full rounded object-cover" />
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Photos shared in posts will appear here.</p>
                )}
              </section>
              ) : null}
            </aside>
          ) : null}
        </div>
      )}
    </div>
  );
}
