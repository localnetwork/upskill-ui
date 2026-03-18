export function formatReadTime(minutes) {
  console.log("minutes", minutes);
  if (minutes < 1) return "1m";
  if (minutes < 60) return `${Math.round(minutes)}m`;

  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return mins
    ? `${hrs}hr${hrs > 1 ? "s" : ""} ${mins}m`
    : `${hrs}hr${hrs > 1 ? "s" : ""}`;
}
