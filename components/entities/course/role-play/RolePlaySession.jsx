import { useCallback, useEffect, useRef, useState } from "react";
import {
  Captions,
  MessageSquare,
  Mic,
  MicOff,
  PanelLeft,
  PhoneOff,
  Send,
  Timer,
  X,
} from "lucide-react";
import BaseApi from "@/lib/api/_base.api";
import persistentStore from "@/lib/store/persistentStore";
import {
  getRolePlayCharacter,
  previewRolePlayVoice,
  stopRolePlayVoice,
} from "@/lib/rolePlayCharacters";
import { CharacterAvatar } from "./CharacterPickerModal";

const API = process.env.NEXT_PUBLIC_API_URL;
const SPEEDS = [1, 1.25, 1.5];
const TABS = ["Scenario", "Roles", "Goals"];

const words = (value) =>
  String(value || "")
    .toLowerCase()
    .match(/[a-z0-9']+/g) || [];

// Ignores the AI's own voice being picked up by the microphone as an interruption.
function isEcho(heard, spoken) {
  const heardWords = words(heard);
  if (!heardWords.length) return true;
  const spokenWords = new Set(words(spoken));
  const matches = heardWords.filter((word) => spokenWords.has(word)).length;
  return matches / heardWords.length >= 0.7;
}

const formatClock = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export default function RolePlaySession({
  details,
  lessonId,
  mode,
  onExit,
  onEnded,
}) {
  const profile = persistentStore((state) => state.profile);
  const character = details.ai_character || {};
  const voice = getRolePlayCharacter(character.voice);
  const isAudio = mode === "audio";

  const [messages, setMessages] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(details.duration_minutes * 60);
  const [tab, setTab] = useState("Scenario");
  const [panelOpen, setPanelOpen] = useState(true);
  const [muted, setMuted] = useState(false);
  const [captions, setCaptions] = useState(!isAudio);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [chatOpen, setChatOpen] = useState(!isAudio);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [ended, setEnded] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const messagesRef = useRef([]);
  const recognitionRef = useRef(null);
  const endedRef = useRef(false);
  const mutedRef = useRef(false);
  const speedRef = useRef(1);
  const scrollRef = useRef(null);
  const startedAtRef = useRef(Date.now());
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    setListening(false);
    if (recognition) {
      recognition.onend = null;
      recognition.abort();
    }
  }, []);

  const sendRef = useRef(null);

  const busyRef = useRef(false);
  const speakingRef = useRef(false);
  const aiTextRef = useRef("");
  const finishSpeechRef = useRef(null);
  const restartTimerRef = useRef(null);

  const listen = useCallback(() => {
    if (
      !isAudio ||
      endedRef.current ||
      mutedRef.current ||
      busyRef.current ||
      recognitionRef.current
    )
      return;
    const Recognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!Recognition) {
      setVoiceError(
        "Voice input isn't supported in this browser. Use Chrome or Edge, or type in the chat.",
      );
      setChatOpen(true);
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result?.[0]?.transcript?.trim();
      if (!transcript) return;
      if (speakingRef.current) {
        if (isEcho(transcript, aiTextRef.current)) return;
        // The learner started talking over the AI, so cut the AI off immediately.
        if (transcript.split(/\s+/).length < 2 && !result.isFinal) return;
        interruptSpeech();
      }
      if (result.isFinal) {
        setVoiceError("");
        sendRef.current?.(transcript);
      }
    };
    recognition.onerror = (event) => {
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        endedRecognition(recognition, false);
        setVoiceError(
          "Microphone access is blocked. Allow it in your browser's site settings, then reload.",
        );
        setChatOpen(true);
      } else if (event.error === "network") {
        endedRecognition(recognition, false);
        setVoiceError(
          "Voice recognition needs an internet connection. You can type in the chat instead.",
        );
        setChatOpen(true);
      } else if (event.error === "audio-capture") {
        endedRecognition(recognition, false);
        setVoiceError("No microphone was found. Check your input device.");
      }
    };
    // Browsers stop recognition after a pause, so keep restarting while it's the learner's turn.
    recognition.onend = () => endedRecognition(recognition, true);
    recognitionRef.current = recognition;
    setListening(true);
    try {
      recognition.start();
    } catch (_error) {
      endedRecognition(recognition, false);
    }
  }, [isAudio]);

  function interruptSpeech() {
    speakingRef.current = false;
    stopRolePlayVoice();
    finishSpeechRef.current?.();
  }

  function endedRecognition(recognition, restart) {
    if (recognitionRef.current === recognition) recognitionRef.current = null;
    setListening(false);
    if (restart && !endedRef.current && !mutedRef.current && !busyRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = setTimeout(() => listenRef.current?.(), 250);
    }
  }

  const listenRef = useRef(null);
  listenRef.current = listen;

  const speak = useCallback(
    (text, onFinished) => {
      if (!isAudio) return;
      speakingRef.current = true;
      aiTextRef.current = text;
      setSpeaking(true);
      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        clearTimeout(fallback);
        speakingRef.current = false;
        setSpeaking(false);
        if (onFinished) onFinished();
        else listen();
      };
      finishSpeechRef.current = done;
      // Some browsers never fire the end event, so don't let the conversation stall.
      const fallback = setTimeout(
        done,
        (text.length * 90) / speedRef.current + 8000,
      );
      // The microphone stays open while the AI talks so the learner can interrupt.
      if (!onFinished) listen();
      if (
        !previewRolePlayVoice(voice, text, {
          rate: speedRef.current,
          onEnd: done,
        })
      )
        done();
    },
    [isAudio, listen, voice],
  );

  const addMessage = useCallback((role, content) => {
    const at = Math.round((Date.now() - startedAtRef.current) / 1000);
    messagesRef.current = [...messagesRef.current, { role, content, at }];
    setMessages(messagesRef.current);
  }, []);

  const send = useCallback(
    async (text) => {
      const content = String(text || "").trim();
      if (!content || endedRef.current) return;
      busyRef.current = true;
      stopListening();
      interruptSpeech();
      addMessage("user", content);
      setThinking(true);
      try {
        const response = await BaseApi.post(
          `${API}/course-curriculums/${lessonId}/role-play/chat`,
          {
            role_play: details,
            messages: messagesRef.current,
          },
        );
        if (endedRef.current) return;
        const reply =
          response?.data?.data?.reply || "Could you say more about that?";
        const conversationEnded = Boolean(response?.data?.data?.ended);
        busyRef.current = false;
        addMessage("assistant", reply);
        if (conversationEnded) {
          // Let the closing line finish before wrapping up the session.
          if (isAudio) speak(reply, () => endSessionRef.current?.(true));
          else setTimeout(() => endSessionRef.current?.(true), 2500);
        } else {
          speak(reply);
        }
      } catch (_error) {
        if (endedRef.current) return;
        const reply = "Sorry, I didn't catch that. Could you repeat it?";
        busyRef.current = false;
        addMessage("assistant", reply);
        speak(reply);
      } finally {
        setThinking(false);
      }
    },
    [addMessage, details, isAudio, lessonId, speak, stopListening],
  );
  sendRef.current = send;
  const endSessionRef = useRef(null);

  const endSession = useCallback(
    (completed = true) => {
      if (endedRef.current) return;
      endedRef.current = true;
      onEndedRef.current?.({
        completed,
        mode,
        messages: messagesRef.current,
        started_at: new Date(startedAtRef.current).toISOString(),
        duration_seconds: Math.round(
          (Date.now() - startedAtRef.current) / 1000,
        ),
      });
      speakingRef.current = false;
      stopListening();
      stopRolePlayVoice();
      setSpeaking(false);
      setEnded(true);
    },
    [mode, stopListening],
  );
  endSessionRef.current = endSession;

  useEffect(() => {
    // Strict Mode remounts this component, so reset what the previous cleanup marked as finished.
    endedRef.current = false;
    busyRef.current = false;
    messagesRef.current = [];
    setMessages([]);
    if (details.opening_message) {
      addMessage("assistant", details.opening_message);
      speak(details.opening_message);
    } else {
      listen();
    }
    return () => {
      endedRef.current = true;
      clearTimeout(restartTimerRef.current);
      stopListening();
      stopRolePlayVoice();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ended) return undefined;
    const timer = setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [ended]);

  useEffect(() => {
    if (secondsLeft === 0 && !endedRef.current) endSession();
  }, [secondsLeft, endSession]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, thinking, chatOpen]);

  const toggleMute = () => {
    const next = !muted;
    mutedRef.current = next;
    setMuted(next);
    if (next) stopListening();
    else listen();
  };

  const cycleSpeed = () => {
    const next = (speedIndex + 1) % SPEEDS.length;
    speedRef.current = SPEEDS[next];
    setSpeedIndex(next);
  };

  const submitDraft = (event) => {
    event.preventDefault();
    if (thinking) return;
    const text = draft;
    setDraft("");
    send(text);
  };

  const lastAiLine = [...messages]
    .reverse()
    .find((message) => message.role === "assistant")?.content;
  const learnerName = profile?.fullName || profile?.username || "You";
  const status = thinking
    ? "Thinking…"
    : speaking
      ? "Speaking…"
      : listening
        ? "Listening…"
        : "";
  const goals = (details.learner_goals || []).filter(Boolean);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              endSession(false);
              onExit();
            }}
            aria-label="Exit role play"
          >
            <X size={20} />
          </button>
          <span className="text-[13px] font-medium text-slate-900">
            {details.meeting_title}
          </span>
        </div>
        <span className="flex items-center gap-1.5 rounded border border-slate-300 px-3 py-1 text-[13px] text-slate-900">
          <Timer size={14} /> {formatClock(secondsLeft)}
        </span>
      </div>

      <div className="flex min-h-0 grow">
        {panelOpen ? (
          <aside className="flex w-[335px] shrink-0 flex-col bg-[#f6f7f9]">
            <div className="flex items-center gap-2 p-4">
              <div className="flex rounded-full bg-slate-200/70 p-1">
                {TABS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setTab(name)}
                    className={`rounded-full px-4 py-1.5 text-[13px] font-medium ${
                      tab === name
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Hide panel"
              >
                <PanelLeft size={18} />
              </button>
            </div>
            <div className="grow overflow-y-auto px-5 pb-4 text-[13px] leading-relaxed text-slate-500">
              {tab === "Scenario" && (
                <p className="whitespace-pre-line">{details.scenario}</p>
              )}
              {tab === "Roles" && (
                <div className="space-y-3 text-slate-800">
                  <p>
                    <span className="font-bold">{character.name}</span> (AI) —{" "}
                    {character.role}
                  </p>
                  <p>
                    <span className="font-bold">{learnerName}</span> (You) —{" "}
                    {details.learner_role}
                  </p>
                </div>
              )}
              {tab === "Goals" && (
                <ol className="space-y-3 text-slate-800">
                  {goals.map((goal, index) => (
                    <li key={index} className="flex gap-3">
                      <span>{index + 1}</span>
                      <span>{goal}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </aside>
        ) : (
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="m-4 h-fit rounded-full bg-[#f6f7f9] p-2"
            aria-label="Show panel"
          >
            <PanelLeft size={18} />
          </button>
        )}

        <main className="relative flex min-w-0 grow flex-col items-center">
          {chatOpen ? (
            <div className="flex min-h-0 w-full max-w-[640px] grow flex-col px-4 pb-28 pt-4">
              <div ref={scrollRef} className="grow space-y-3 overflow-y-auto">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <p
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-[14px] ${
                        message.role === "user"
                          ? "bg-primary text-white"
                          : "bg-[#f6f7f9] text-slate-900"
                      }`}
                    >
                      {message.content}
                    </p>
                  </div>
                ))}
                {thinking && (
                  <p className="text-[13px] text-slate-500">
                    {character.name} is typing…
                  </p>
                )}
              </div>
              {!ended && (
                <form onSubmit={submitDraft} className="mt-3 flex gap-2">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Type your message"
                    className="grow rounded-md border border-slate-300 px-3 py-2 text-[14px] outline-none focus:border-[#6d28d2]"
                  />
                  <button
                    type="submit"
                    disabled={thinking || !draft.trim()}
                    className="rounded-md bg-primary px-3 text-white disabled:opacity-50"
                    aria-label="Send"
                  >
                    <Send size={16} />
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="flex grow flex-col items-center justify-center pb-24">
              <div
                className={
                  speaking ? "rounded-full ring-4 ring-[#6d28d2]/30" : ""
                }
              >
                <CharacterAvatar character={voice} size={150} />
              </div>
              <p className="mt-5 text-[18px] font-bold text-slate-900">
                {character.name}
              </p>
              <p className="max-w-[200px] text-center text-[14px] text-slate-500">
                {character.role}
              </p>
              {status && (
                <p className="mt-3 text-[12px] text-primary">{status}</p>
              )}
              {voiceError && (
                <p className="mt-3 max-w-[420px] rounded-md bg-red-50 px-3 py-2 text-center text-[12px] text-red-700">
                  {voiceError}
                </p>
              )}
              {captions && lastAiLine && (
                <p className="mt-4 max-w-[520px] rounded-md bg-slate-900/85 px-4 py-2 text-center text-[14px] text-white">
                  {lastAiLine}
                </p>
              )}
            </div>
          )}

          {!ended && (
            <div className="absolute bottom-6 flex items-center gap-3 rounded-full border border-slate-300 bg-white px-4 py-2 shadow-sm">
              {isAudio && (
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute" : "Mute"}
                  className={listening ? "text-primary" : "text-slate-800"}
                >
                  {muted ? (
                    <MicOff size={18} className="text-red-500" />
                  ) : (
                    <Mic size={18} />
                  )}
                </button>
              )}
              {isAudio && (
                <>
                  <span className="h-6 w-px bg-slate-200" />
                  <button
                    type="button"
                    onClick={() => setCaptions((value) => !value)}
                    aria-label="Toggle captions"
                    className={captions ? "text-primary" : "text-slate-800"}
                  >
                    <Captions size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={cycleSpeed}
                    className="w-9 text-[13px] font-bold text-slate-800"
                    aria-label="Playback speed"
                  >
                    {SPEEDS[speedIndex]}x
                  </button>
                  <span className="h-6 w-px bg-slate-200" />
                </>
              )}
              <button
                type="button"
                onClick={() => setChatOpen((value) => !value)}
                aria-label="Toggle transcript"
                className={chatOpen ? "text-primary" : "text-slate-800"}
              >
                <MessageSquare size={18} />
              </button>
              <button
                type="button"
                onClick={() => endSession(true)}
                aria-label="End role play"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white"
              >
                <PhoneOff size={18} />
              </button>
            </div>
          )}

          {ended && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg">
                <h2 className="text-[20px] font-bold text-slate-900">
                  Role Play ended
                </h2>
                <p className="mt-1 text-[14px] text-slate-500">
                  Nice work practicing with {character.name}. You can try again
                  anytime.
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={onExit}
                    className="rounded-md border border-[#6d28d2] px-4 py-2 text-[14px] font-bold text-primary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
