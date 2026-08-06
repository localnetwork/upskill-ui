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
  return (
    <div className="my-2 flex flex-col items-center text-center relative">
      <p className="text-xs italic text-[#333]">
        {message.body || message.text || ""}
      </p>
      {message.createdAt ? (
        <span className="mt-0.5 text-[11px] text-slate-400">
          {formatTime(message.createdAt)}
        </span>
      ) : null}
    </div>
  );
}
