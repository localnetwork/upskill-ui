import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";
import {
  Info,
  MessageSquare,
  Mic,
  RefreshCw,
  Sparkles,
  Timer,
  X,
} from "lucide-react";
import persistentStore from "@/lib/store/persistentStore";
import { getRolePlayCharacter } from "@/lib/rolePlayCharacters";
import { CharacterAvatar } from "./CharacterPickerModal";
import RolePlaySession from "./RolePlaySession";
import RolePlayAttempts from "./RolePlayAttempts";

const API = process.env.NEXT_PUBLIC_API_URL;

const NOTICE_KEY = "rolePlayNoticeDismissed";

const HOW_IT_WORKS = [
  {
    title: "Choose how to talk",
    text: "Pick Audio to speak out loud or Text to type your messages.",
  },
  {
    title: "Have the conversation",
    text: "The AI character plays their role in the scenario and responds to what you say, in real time.",
  },
  {
    title: "Work toward your goals",
    text: "Keep an eye on the timer. You can't pause or restart once you begin.",
  },
  {
    title: "Review your practice",
    text: "Get a feedback report and a full transcript, then practice again as many times as you like.",
  },
];

const MODES = [
  {
    id: "audio",
    title: "Audio",
    text: "Have a voice-only conversation with the AI character.",
    Icon: Mic,
  },
  {
    id: "text",
    title: "Text",
    text: "Practice the conversation by writing messages.",
    Icon: MessageSquare,
  },
];

function Dialog({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[500px] rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between">
          <h2 className="text-[16px] font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function profileAvatar(profile) {
  const path = profile?.user_picture?.path;
  if (!path) return null;
  return /^https?:\/\//.test(path)
    ? path
    : `${process.env.NEXT_PUBLIC_API_DOMAIN}${path}`;
}

function Card({ title, children }) {
  return (
    <section className="rounded-xl bg-[#f6f7f9] p-5">
      <h2 className="text-[16px] font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export default function RolePlayPreview({
  details,
  lessonId,
  onClose,
  onAttemptSaved,
}) {
  const [flow, setFlow] = useState(null);
  const [mode, setMode] = useState("");
  const [dontShow, setDontShow] = useState(false);
  const [micError, setMicError] = useState("");
  const [checkingMic, setCheckingMic] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!lessonId) return;
    BaseApi.get(`${API}/course-curriculums/${lessonId}/role-play/attempts`)
      .then((response) => setAttempts(response?.data?.data || []))
      .catch(() => {});
  }, [lessonId]);

  const saveAttempt = useCallback(
    async (payload) => {
      try {
        const response = await BaseApi.post(
          `${API}/course-curriculums/${lessonId}/role-play/attempts`,
          {
            ...payload,
            role_play: details,
          },
        );
        const attempt = response?.data?.data;
        if (attempt) {
          setAttempts((previous) => [...previous, attempt]);
          setSelectedId(attempt.id);
          if (attempt.completed) onAttemptSaved?.(attempt);
        }
      } catch (_error) {
        toast.error("Couldn't save this practice");
      }
    },
    [details, lessonId, onAttemptSaved],
  );
  const profile = persistentStore((state) => state.profile);
  const avatar = profileAvatar(profile);
  const character = details.ai_character || {};
  const voice = getRolePlayCharacter(character.voice);
  const learnerName = profile?.fullName || profile?.username || "You";
  const goals = (details.learner_goals || []).filter(Boolean);

  // Audio mode needs the microphone, so ask for it from the user's click before starting.
  const requestMic = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError(
        "Your browser doesn't support microphone access. Use Text mode or a different browser.",
      );
      return false;
    }
    setCheckingMic(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (_error) {
      setMicError(
        "Microphone access was blocked. Allow it in your browser's site settings and try again, or choose Text mode.",
      );
      return false;
    } finally {
      setCheckingMic(false);
    }
  };

  const beginSession = async () => {
    setMicError("");
    if (mode === "audio" && !(await requestMic())) return;
    if (dontShow) localStorage.setItem(NOTICE_KEY, "1");
    setFlow("session");
  };
  const afterMode = () => {
    setMicError("");
    if (localStorage.getItem(NOTICE_KEY)) beginSession();
    else setFlow("notice");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white">
      <div className="flex items-center gap-4 px-6 py-4">
        <button
          className="text-primary"
          type="button"
          onClick={onClose}
          aria-label="Close preview"
        >
          <X size={20} />
        </button>
        <span className="text-[13px] font-medium text-slate-900">
          {details.meeting_title}
        </span>
      </div>

      {attempts.length > 0 ? (
        <div className="grow overflow-y-auto">
          <RolePlayAttempts
            title={details.meeting_title}
            attempts={attempts}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onPracticeAgain={() => setFlow("mode")}
            character={character}
          />
        </div>
      ) : (
        <>
          <div className="grow overflow-y-auto pb-24">
            <div className="mx-auto max-w-[670px] space-y-5 px-4 pt-6">
              <div>
                <span className="inline-block rounded border border-sky-300 bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-slate-800">
                  Practice Role Play
                </span>
                <h1 className="mt-3 text-[28px] font-bold text-slate-900">
                  {details.meeting_title}
                </h1>
                <p className="mt-3 text-[14px] text-slate-800">
                  Practice your skills in a realistic conversation. There&apos;s
                  no score, just an opportunity to improve. You can&apos;t pause
                  or restart once you begin.
                </p>
                <div className="mt-5 flex items-center gap-5">
                  <button
                    type="button"
                    onClick={() => setFlow("mode")}
                    className="rounded-md bg-primary px-4 py-3 text-[14px] font-bold text-white"
                  >
                    Start Role Play
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlow("how")}
                    className="flex items-center gap-1 text-[13px] font-bold text-primary"
                  >
                    <Info size={14} /> How Role Play works
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl bg-[#f6f7f9] p-5">
                <div>
                  <p className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Timer size={12} /> Duration
                  </p>
                  <p className="mt-1 text-[15px] text-slate-900">
                    {details.duration_minutes} mins
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-[11px] text-slate-500">
                    <RefreshCw size={12} /> Attempts
                  </p>
                  <p className="mt-1 text-[15px] text-slate-900">Unlimited</p>
                </div>
              </div>

              <Card title="Scenario">
                <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-slate-500">
                  {details.scenario}
                </p>
              </Card>

              <Card title="Roles">
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center rounded-lg border border-slate-200 p-4 text-center">
                    <CharacterAvatar character={voice} size={52} />
                    <p className="mt-2 flex items-center gap-1 text-[15px] text-slate-900">
                      {character.name}
                      <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                        <Sparkles size={10} /> AI Character
                      </span>
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {character.role}
                    </p>
                  </div>
                  <div className="flex flex-col items-center rounded-lg border border-slate-200 p-4 text-center">
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatar}
                        alt={learnerName}
                        className="h-[52px] w-[52px] rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-slate-800 text-[18px] font-bold text-white">
                        {learnerName[0]}
                      </span>
                    )}
                    <p className="mt-2 text-[15px] text-slate-900">
                      {learnerName}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {details.learner_role}
                    </p>
                  </div>
                </div>
                {character.name && (
                  <div className="mt-4">
                    <p className="text-[12px] font-bold text-slate-900">
                      About {character.name}
                    </p>
                    <div
                      className="role-play-rich mt-1 text-[13px] leading-relaxed text-slate-500 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                      dangerouslySetInnerHTML={{
                        __html: character.personality || "",
                      }}
                    />
                  </div>
                )}
              </Card>

              <Card title="Goals">
                <ol className="mt-3 space-y-3">
                  {goals.map((goal, index) => (
                    <li
                      key={index}
                      className="flex gap-6 text-[13px] text-slate-800"
                    >
                      <span className="w-3 shrink-0 text-slate-600">
                        {index + 1}
                      </span>
                      <span>{goal}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white to-transparent pb-5 pt-10">
            <div className="mx-auto max-w-[670px] px-4">
              <button
                type="button"
                onClick={() => setFlow("mode")}
                className="rounded-md bg-primary px-4 py-3 text-[14px] font-bold text-white"
              >
                Start Role Play
              </button>
            </div>
          </div>
        </>
      )}

      {flow === "how" && (
        <Dialog title="How Role Play works" onClose={() => setFlow(null)}>
          <ol className="mt-5 space-y-4">
            {HOW_IT_WORKS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white">
                  {index + 1}
                </span>
                <span>
                  <span className="block text-[13px] font-bold text-slate-900">
                    {step.title}
                  </span>
                  <span className="block text-[13px] text-slate-700">
                    {step.text}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setFlow(null)}
              className="rounded-md bg-primary px-5 py-2.5 text-[13px] font-bold text-white"
            >
              Got it
            </button>
          </div>
        </Dialog>
      )}

      {flow === "mode" && (
        <Dialog title="How do you want to start?" onClose={() => setFlow(null)}>
          <p className="mt-5 text-[13px] text-slate-800">
            Choose how you&apos;d like to interact with the AI character.
          </p>
          <div className="mt-4 space-y-3">
            {MODES.map(({ id, title, text, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={`flex w-full items-center gap-4 rounded-md text-primary border px-4 py-3 text-left ${
                  mode === id
                    ? "border-[#6d28d2] ring-1 ring-[#6d28d2]"
                    : "border-slate-300"
                }`}
              >
                <Icon size={18} />
                <span>
                  <span className="block text-[13px] font-bold text-slate-900">
                    {title}
                  </span>
                  <span className="block text-[13px] text-slate-800">
                    {text}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {micError && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {micError}
            </p>
          )}
          <div className="mt-6 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                setFlow(null);
                setMicError("");
              }}
              className="text-[13px] font-bold text-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!mode || checkingMic}
              onClick={afterMode}
              className="rounded-md bg-primary px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </Dialog>
      )}

      {flow === "notice" && (
        <Dialog
          title="Before you start your AI Role Play"
          onClose={() => setFlow(null)}
        >
          <p className="mt-5 text-[13px] text-slate-800">
            This feature uses AI to simulate real conversations for learning
            purposes, so please keep in mind:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-8 text-[13px] text-slate-800">
            <li>The AI may make mistakes or provide imperfect responses</li>
            <li>Avoid sharing any personal or sensitive information</li>
            <li>Your audio is processed live but not stored</li>
          </ul>
          {micError && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {micError}
            </p>
          )}
          <div className="mt-5 flex items-center justify-between">
            <label className="flex items-center gap-2 text-[12px] text-slate-800">
              <input
                type="checkbox"
                checked={dontShow}
                onChange={(event) => setDontShow(event.target.checked)}
              />
              Don&apos;t show this again
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setFlow("mode")}
                className="text-[13px] font-bold text-primary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={beginSession}
                disabled={checkingMic}
                className="rounded-md bg-primary px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
              >
                {checkingMic ? "Waiting for microphone?" : "Start Role Play"}
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {flow === "session" && (
        <RolePlaySession
          details={details}
          lessonId={lessonId}
          mode={mode}
          onEnded={saveAttempt}
          onExit={() => setFlow(null)}
        />
      )}
    </div>
  );
}
