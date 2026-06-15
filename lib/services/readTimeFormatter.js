export function formatReadTime(seconds) {
  const totalSeconds = Number(seconds || 0);
  if (totalSeconds <= 0) return "1m";

  const totalMinutes = Math.max(1, Math.ceil(totalSeconds / 60));
  if (totalMinutes < 60) return `${totalMinutes}m`;

  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return mins ? `${hrs}hr${hrs > 1 ? "s" : ""} ${mins}m` : `${hrs}hr${hrs > 1 ? "s" : ""}`;
}
