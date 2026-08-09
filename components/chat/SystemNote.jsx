function formatTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch (_error) {
    return "";
  }
}

export default function SystemNote({ message }) {
  if (!message) return null;
  const isCallStarted = message?.metadata?.kind === "call_started";
  const canJoinCall = isCallStarted && typeof message?.onJoinCall === "function";

  return (
    <div className="my-2 flex flex-col items-center text-center relative">
      <p className="text-xs italic text-[#333]">
        {message.body || message.text || ""}
      </p>
      {canJoinCall ? (
        <button
          type="button"
          onClick={message.onJoinCall}
          className="mt-1 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-blue-700"
        >
          Join
        </button>
      ) : null}
      {message.createdAt ? (
        <span className="mt-0.5 text-[11px] text-slate-400">
          {formatTime(message.createdAt)}
        </span>
      ) : null}
    </div>
  );
}
