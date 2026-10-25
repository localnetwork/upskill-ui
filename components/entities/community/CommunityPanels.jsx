import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import COMMUNITYAPI from "@/lib/api/community/request";
import BanDialog from "./BanDialog";
import BadgeDialog from "./BadgeDialog";
import { Avatar, RoleBadge, errorMessage } from "./CommunityShared";

const RANK = { MEMBER: 1, MODERATOR: 2, ADMIN: 3 };

export function MembersPanel({ slug, me, role }) {
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState("");
  const [showBanned, setShowBanned] = useState(false);
  const [loading, setLoading] = useState(true);
  const isStaff = RANK[role] >= RANK.MODERATOR;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await COMMUNITYAPI.members(slug, {
        q: query.trim() || undefined,
        banned: showBanned ? "true" : undefined,
      });
      setMembers(res?.data?.data || []);
    } catch (e) {
      toast.error(errorMessage(e, "Failed to load members"));
    } finally {
      setLoading(false);
    }
  }, [slug, query, showBanned]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const run = async (fn, success) => {
    try {
      await fn();
      toast.success(success);
      load();
    } catch (e) {
      toast.error(errorMessage(e, "Action failed"));
    }
  };

  const toggleModerator = (m) =>
    run(
      () => COMMUNITYAPI.updateMember(slug, m.id, { role: m.role === "MODERATOR" ? "MEMBER" : "MODERATOR" }),
      m.role === "MODERATOR" ? "Moderator removed" : "Moderator assigned",
    );

  const [badgeTarget, setBadgeTarget] = useState(null);

  const editBadge = (m) => setBadgeTarget(m);

  const confirmBadge = async (badge) => {
    const m = badgeTarget;
    setBadgeTarget(null);
    await run(() => COMMUNITYAPI.updateMember(slug, m.id, { badge }), "Badge updated");
  };

  const [banTarget, setBanTarget] = useState(null);

  const ban = (m) => setBanTarget(m);

  const confirmBan = async (days) => {
    const m = banTarget;
    setBanTarget(null);
    await run(() => COMMUNITYAPI.ban(slug, m.id, undefined, days), "Member banned");
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members"
          className="min-w-[200px] flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
        />
        {isStaff ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showBanned} onChange={(e) => setShowBanned(e.target.checked)} />
            Banned members
          </label>
        ) : null}
      </div>
      {loading ? <p className="text-slate-400">Loading…</p> : null}
      <ul className="divide-y divide-slate-100">
        {members.map((m) => {
          const canModerate = isStaff && m.id !== me && RANK[m.role] < RANK[role];
          return (
            <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
              <Avatar user={m} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{m.name}</span>
                  <RoleBadge role={m.role} badge={m.badge} />
                </div>
                <p className="text-xs text-slate-500">
                  @{m.username}
                  {m.banned && m.banReason ? ` · ${m.banReason}` : ""}
                  {m.banned
                    ? m.bannedUntil
                      ? ` · Banned until ${new Date(m.bannedUntil).toLocaleDateString()}`
                      : " · Banned permanently"
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {role === "ADMIN" && m.role !== "ADMIN" && !m.banned ? (
                  <>
                    <button type="button" onClick={() => toggleModerator(m)} className="rounded border border-slate-300 px-2 py-1">
                      {m.role === "MODERATOR" ? "Remove moderator" : "Make moderator"}
                    </button>
                    <button type="button" onClick={() => editBadge(m)} className="rounded border border-slate-300 px-2 py-1">
                      Badge
                    </button>
                  </>
                ) : null}
                {canModerate && !m.banned ? (
                  <button type="button" onClick={() => ban(m)} className="rounded border border-red-300 px-2 py-1 text-red-600">
                    Ban
                  </button>
                ) : null}
                {isStaff && m.banned ? (
                  <button type="button" onClick={() => run(() => COMMUNITYAPI.unban(slug, m.id), "Member unbanned")} className="rounded border border-slate-300 px-2 py-1">
                    Unban
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {!loading && members.length === 0 ? <p className="py-6 text-center text-slate-500">No members found.</p> : null}
      {banTarget ? (
        <BanDialog name={banTarget.name} onCancel={() => setBanTarget(null)} onConfirm={confirmBan} />
      ) : null}
      {badgeTarget ? (
        <BadgeDialog
          name={badgeTarget.name}
          current={badgeTarget.badge}
          onCancel={() => setBadgeTarget(null)}
          onConfirm={confirmBadge}
        />
      ) : null}
    </div>
  );
}

export function ReportsPanel({ slug }) {
  const [reports, setReports] = useState([]);
  const [banReport, setBanReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await COMMUNITYAPI.reports(slug);
      setReports(res?.data?.data || []);
    } catch (e) {
      toast.error(errorMessage(e, "Failed to load reports"));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const resolve = async (report, action) => {
    try {
      await COMMUNITYAPI.resolveReport(slug, report.id, action);
      setReports((prev) => prev.filter((r) => r.id !== report.id));
      toast.success(action === "REMOVE" ? "Content removed" : "Report dismissed");
    } catch (e) {
      toast.error(errorMessage(e, "Action failed"));
    }
  };

  const banAuthor = (report) => {
    if (report.content?.author) setBanReport(report);
  };

  const confirmBanAuthor = async (days) => {
    const report = banReport;
    const author = report.content.author;
    setBanReport(null);
    try {
      await COMMUNITYAPI.ban(slug, author.id, `Report: ${report.reason}`.slice(0, 300), days);
      toast.success("Member banned");
    } catch (e) {
      toast.error(errorMessage(e, "Failed to ban"));
    }
  };

  return (
    <div className="space-y-3">
      {loading ? <p className="text-slate-400">Loading…</p> : null}
      {!loading && reports.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white py-10 text-center text-slate-500">No open reports.</p>
      ) : null}
      {reports.map((r) => (
        <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">
            {r.targetType} reported by {r.reporter?.name}
          </p>
          <p className="mt-1 text-sm">
            <span className="font-semibold">Reason:</span> {r.reason}
          </p>
          <blockquote className="mt-2 rounded-lg bg-slate-50 p-3 text-sm">
            {r.content ? (
              <>
                <p className="mb-1 font-semibold">{r.content.author?.name}</p>
                <p className="whitespace-pre-wrap break-words">{r.content.deleted ? "(already removed)" : r.content.body}</p>
              </>
            ) : (
              "Content no longer available"
            )}
          </blockquote>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <button type="button" onClick={() => resolve(r, "REMOVE")} className="rounded border border-red-300 px-3 py-1 text-red-600">
              Remove content
            </button>
            <button type="button" onClick={() => banAuthor(r)} className="rounded border border-slate-300 px-3 py-1">
              Ban author
            </button>
            <button type="button" onClick={() => resolve(r, "DISMISS")} className="rounded border border-slate-300 px-3 py-1">
              Dismiss
            </button>
          </div>
        </div>
      ))}
      {banReport ? (
        <BanDialog
          name={banReport.content?.author?.name}
          onCancel={() => setBanReport(null)}
          onConfirm={confirmBanAuthor}
        />
      ) : null}
    </div>
  );
}
