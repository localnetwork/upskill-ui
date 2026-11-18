import { useEffect, useRef, useState } from "react";
import {
  Clock,
  Expand,
  FileDown,
  Info,
  Loader2,
  Maximize2,
  Minimize2,
  Shrink,
} from "lucide-react";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";
import MiniEditor from "@/components/entities/course/assignment/MiniEditor";
import { assetUrl } from "@/components/entities/course/assignment/FileUploader";

const API = process.env.NEXT_PUBLIC_API_URL;
const STEPS = ["Instructions", "Submission", "Instructor example"];
const PURPLE = "#6d28d2";

const plain = (html) =>
  String(html || "")
    .replace(/<[^>]*>/g, "")
    .trim();

function PrimaryButton({ children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className="h-[42px] rounded-lg bg-primary px-6 text-[15px] font-bold text-white disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function OutlineButton({ children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className="h-[50px] rounded-lg border border-primary px-4 text-[15px] font-bold text-primary disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function Stepper({ step }) {
  const last = STEPS.length - 1;
  const align = (index) =>
    index === 0 ? "text-left" : index === last ? "text-right" : "text-center";
  const dotColor = (index) =>
    index === step ? "#5022c3" : index < step ? "#a98bea" : "#d1d2e0";
  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 pt-4 sm:px-8">
      <div className="flex">
        {STEPS.map((label, index) => (
          <div
            key={label}
            className={`flex-1 text-[13px] sm:text-[16px] ${align(index)} ${
              index === step ? "font-bold text-[#2d2f31]" : "text-[#3e4143]"
            }`}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="relative mt-3 flex h-[20px] items-center">
        <span className="absolute left-0 right-0 h-[6px] rounded-full bg-[#d1d2e0]" />
        <span
          className="absolute left-0 h-[6px] rounded-full bg-[#a98bea] transition-all"
          style={{ width: `${(step / last) * 100}%` }}
        />
        {STEPS.map((label, index) => (
          <span
            key={label}
            className="absolute h-[20px] w-[20px] rounded-full ring-4 ring-white"
            style={{
              background: dotColor(index),
              left: `${(index / last) * 100}%`,
              transform: `translateX(-${(index / last) * 100}%)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Person({ name, picture }) {
  const src = typeof picture === "string" ? picture : picture?.url || "";
  return (
    <div className="my-3 flex items-center gap-4">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={assetUrl(src)}
          alt=""
          className="h-[60px] w-[60px] rounded-full object-cover"
        />
      ) : (
        <span className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#2d2f31] text-[22px] font-bold text-white">
          {(name || "?").charAt(0).toUpperCase()}
        </span>
      )}
      <span className="text-[16px]" style={{ color: PURPLE }}>
        {name}
      </span>
    </div>
  );
}

function QuestionList({ questions, answers }) {
  return (
    <ol className="space-y-3">
      {questions.map((question, index) => (
        <li key={question.id} className="flex gap-3 text-[16px] text-[#3e4143]">
          <span className="font-bold text-[#2d2f31]">{index + 1}.</span>
          <div className="min-w-0 flex-1 break-words">
            <div dangerouslySetInnerHTML={{ __html: question.body }} />
            {answers !== undefined ? (
              answers[question.id] ? (
                <div
                  className="mt-2 rounded border border-[#d1d7dc] bg-[#f7f9fa] px-3 py-2"
                  dangerouslySetInnerHTML={{ __html: answers[question.id] }}
                />
              ) : null
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function AssignmentLearn({
  lecture,
  course,
  setCourse,
  nextLecture,
  onNavigate,
  panelStatus,
  setPanelStatus,
}) {
  const asset = lecture?.asset;
  const hasAsset = Boolean(asset);
  const [phase, setPhase] = useState("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submission, setSubmission] = useState({ status: "NONE" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef(null);
  const expanded = panelStatus === "closed";
  const toggleWide = () => setPanelStatus?.(expanded ? "open" : "closed");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement)
        await rootRef.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      toast.error("Fullscreen is not supported in this browser");
    }
  };

  const shell = (children) => (
    <div
      ref={rootRef}
      className="absolute inset-0 flex flex-col bg-white text-[#2d2f31]"
    >
      {children}
    </div>
  );

  useEffect(() => {
    if (!lecture?.id || !asset) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    setPhase("intro");
    setStep(0);
    setLoading(true);
    (async () => {
      try {
        const response = await BaseApi.get(
          `${API}/course-curriculums/${lecture.id}/assignment-submission`,
        );
        const data = response?.data?.data || {};
        if (!active) return;
        setSubmission(data);
        setAnswers(data.answers || {});
      } catch {
        // Submission is optional to view; leave defaults.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [lecture?.id, hasAsset]);

  const persist = async (submit) => {
    setBusy(true);
    try {
      const response = await BaseApi.put(
        `${API}/course-curriculums/${lecture.id}/assignment-submission`,
        { answers, submit },
      );
      const data = response?.data?.data || {};
      setSubmission(data);
      if (submit) {
        toast.success("Assignment submitted");
        setCourse?.((prev) =>
          prev
            ? {
                ...prev,
                sections: prev.sections.map((section) => ({
                  ...section,
                  curriculums: section.curriculums.map((c) =>
                    c.id === lecture.id ? { ...c, is_taken: true } : c,
                  ),
                })),
              }
            : prev,
        );
        setStep(2);
      } else {
        toast.success("Draft saved");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Something went wrong",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!asset) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white px-6 text-center text-[#3e4143]">
        This assignment has not been published yet.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  const { instructions = {}, questions = [], solutions = {} } = asset;
  const author = course?.author?.data || {};
  const authorName = author.fullName || author.full_name || "Instructor";
  const submitted = submission.status === "SUBMITTED";
  const hasAnswers = questions.some((q) => plain(answers[q.id]));
  const canSubmit = questions.every((q) => plain(answers[q.id]));
  const duration = asset.duration_minutes;

  const skip = () => {
    if (!nextLecture) {
      toast("This is the last lesson in the course");
    } else if (nextLecture.is_locked) {
      toast.error("The next lesson is locked");
    } else {
      onNavigate?.(nextLecture);
    }
  };

  const footer = (children) => (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#d1d7dc] bg-white px-4 py-3 sm:gap-4 sm:px-8">
      {children}
      <button
        type="button"
        onClick={toggleWide}
        aria-label={expanded ? "Default view" : "Wide screen"}
        className="group relative flex h-[42px] w-[42px] items-center justify-center rounded-lg border border-[#d1d7dc] text-[#2d2f31]"
      >
        {expanded ? <Shrink size={18} /> : <Expand size={18} />}
        <span className="pointer-events-none absolute bottom-full right-0 mb-2 hidden whitespace-nowrap rounded bg-[#2d2f31] px-2 py-1 text-[12px] font-semibold text-white group-hover:block group-focus-visible:block">
          {expanded ? "Default view" : "Wide screen"}
        </span>
      </button>
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        className="group relative flex h-[42px] w-[42px] items-center justify-center rounded-lg border border-[#d1d7dc] text-[#2d2f31]"
      >
        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        <span className="pointer-events-none absolute bottom-full right-0 mb-2 hidden whitespace-nowrap rounded bg-[#2d2f31] px-2 py-1 text-[12px] font-semibold text-white group-hover:block group-focus-visible:block">
          {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        </span>
      </button>
    </div>
  );

  if (phase === "intro") {
    return shell(
      <>
        <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-20 sm:py-[120px]">
          <h2 className="text-[26px] font-bold sm:text-[28px]">
            Assignment: {asset.title || lecture.title}
          </h2>
          {duration ? (
            <p className="mt-3 flex items-center gap-2 text-[16px] text-[#3e4143]">
              <Clock size={20} /> {duration} minutes to complete
            </p>
          ) : null}
          {asset.description ? (
            <p className="mt-12 whitespace-pre-line text-[16px] text-[#3e4143]">
              {asset.description}
            </p>
          ) : null}
        </div>
        {footer(
          <>
            <button
              type="button"
              onClick={skip}
              className="text-[15px] font-bold text-[#2d2f31]"
            >
              Skip assignment
            </button>
            <PrimaryButton onClick={() => setPhase("steps")}>
              Start assignment
            </PrimaryButton>
          </>,
        )}
      </>,
    );
  }

  return shell(
    <>
      <Stepper step={step} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-8">
          {step === 0 && (
            <>
              <h2 className="text-[26px] font-bold sm:text-[28px]">
                Assignment instructions
              </h2>
              <p className="mt-3 flex flex-wrap items-center gap-3 text-[16px] text-[#3e4143]">
                {duration ? (
                  <span className="flex items-center gap-2">
                    <Clock size={20} /> {duration} minutes to complete
                  </span>
                ) : null}
                {duration && instructions.resource?.path ? (
                  <span>|</span>
                ) : null}
                {instructions.resource?.path ? (
                  <a
                    href={assetUrl(instructions.resource.path)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 font-bold"
                    style={{ color: PURPLE }}
                  >
                    <FileDown size={20} /> Resource available
                  </a>
                ) : null}
              </p>
              <div className="mt-8 space-y-6 border border-[#d1d7dc] p-5 shadow-sm sm:p-10">
                {instructions.video?.path ? (
                  <video
                    src={assetUrl(instructions.video.path)}
                    controls
                    className="aspect-video w-full bg-black"
                  />
                ) : null}
                {plain(instructions.text) ? (
                  <div
                    className="text-[16px] text-[#3e4143]"
                    dangerouslySetInnerHTML={{ __html: instructions.text }}
                  />
                ) : null}
                {questions.length ? (
                  <div>
                    <h3 className="mb-3 text-[18px] font-bold">
                      Questions for this assignment
                    </h3>
                    <QuestionList questions={questions} />
                  </div>
                ) : null}
                {instructions.resource?.path ? (
                  <div>
                    <h3 className="mb-3 text-[15px] font-bold">
                      Download resource files
                    </h3>
                    <a
                      href={assetUrl(instructions.resource.path)}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="flex items-center gap-4 break-all text-[16px] text-[#3e4143]"
                    >
                      <FileDown size={22} className="shrink-0" />
                      {instructions.resource.name || "Download"}
                    </a>
                  </div>
                ) : null}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-[26px] font-bold sm:text-[28px]">
                Assignment submission
              </h2>
              <p className="mt-2 text-[16px] text-[#3e4143]">
                {submitted
                  ? "Submitted. You can still update and resubmit your work."
                  : "Save or submit your work"}
              </p>
              <div className="mt-8 space-y-6 border border-[#d1d7dc] p-5 shadow-sm sm:p-10">
                {questions.map((question, index) => (
                  <div key={question.id} className="flex gap-3">
                    <span className="font-bold">{index + 1}.</span>
                    <div className="min-w-0 flex-1 space-y-3">
                      <div
                        className="text-[16px] text-[#3e4143]"
                        dangerouslySetInnerHTML={{ __html: question.body }}
                      />
                      <MiniEditor
                        value={answers[question.id] || ""}
                        onChange={(value) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: value,
                          }))
                        }
                        placeholder="Add your submission"
                        minHeight={150}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <OutlineButton disabled={busy} onClick={() => persist(false)}>
                    Save draft
                  </OutlineButton>
                  <OutlineButton
                    disabled={busy || !canSubmit}
                    onClick={() => persist(true)}
                  >
                    {busy ? "Saving..." : "Submit"}
                  </OutlineButton>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-[26px] font-bold sm:text-[28px]">
                How did you do?
              </h2>
              <p className="mt-2 text-[16px] text-[#3e4143]">
                Compare the instructor&apos;s example to your own
              </p>
              <div className="mt-8 space-y-6">
                <div className="border border-[#d1d7dc] p-5 shadow-sm sm:p-10">
                  <h3 className="text-[18px] font-bold">Instructor example</h3>
                  <Person name={authorName} picture={author.profile_picture} />
                  {solutions.video?.path ? (
                    <video
                      src={assetUrl(solutions.video.path)}
                      controls
                      className="mb-4 aspect-video w-full bg-black"
                    />
                  ) : null}
                  <QuestionList
                    questions={questions}
                    answers={solutions.answers || {}}
                  />
                  {solutions.resource?.path ? (
                    <a
                      href={assetUrl(solutions.resource.path)}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="mt-4 flex items-center gap-3 break-all text-[16px] text-[#3e4143]"
                    >
                      <FileDown size={22} className="shrink-0" />
                      {solutions.resource.name || "Download"}
                    </a>
                  ) : null}
                </div>

                <div className="border border-[#d1d7dc] p-5 shadow-sm sm:p-10">
                  <h3 className="text-[18px] font-bold">Your submission</h3>
                  <Person name="You" picture={null} />
                  <QuestionList questions={questions} answers={answers} />
                  {!submitted ? (
                    <div className="mt-6 flex gap-4 rounded-2xl border border-[#d1d7dc] p-6">
                      <Info
                        size={28}
                        className="shrink-0"
                        style={{ color: PURPLE }}
                      />
                      <div>
                        <p className="text-[18px] font-bold">
                          You haven&apos;t answered the assignment yet.
                        </p>
                        <p className="mt-1 text-[15px] text-[#3e4143]">
                          Submit your work to get constructive feedback from
                          your instructors and peers.
                        </p>
                        <div className="mt-4">
                          <OutlineButton onClick={() => setStep(1)}>
                            Add your answer
                          </OutlineButton>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {footer(
        <>
          <button
            type="button"
            onClick={skip}
            className="mr-auto text-[15px] font-bold text-[#2d2f31]"
          >
            Skip assignment
          </button>
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="text-[15px] font-bold text-[#2d2f31]"
            >
              Previous
            </button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <PrimaryButton onClick={() => setStep(step + 1)}>
              Next
            </PrimaryButton>
          ) : nextLecture ? (
            <PrimaryButton onClick={() => onNavigate?.(nextLecture)}>
              Next lecture
            </PrimaryButton>
          ) : null}
        </>,
      )}
    </>,
  );
}
