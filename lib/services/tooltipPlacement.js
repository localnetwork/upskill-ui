export function getOppositeTooltipPlacement(elPos, tooltipSize) {
  const { innerWidth: winWidth, innerHeight: winHeight } = window;

  // Distance from element to each edge
  const toLeft = elPos.left;
  const toRight = winWidth - (elPos.left + elPos.width);
  const toTop = elPos.top;
  const toBottom = winHeight - (elPos.top + elPos.height);

  // Prefer horizontal placement
  if (toLeft < toRight && toRight >= tooltipSize.width) return "right";
  if (toRight <= toLeft && toLeft >= tooltipSize.width) return "left";

  // Fallback to vertical if not enough horizontal space
  if (toTop >= tooltipSize.height) return "bottom";
  if (toBottom >= tooltipSize.height) return "top";

  // Last resort: pick the side with most space
  const spaces = [
    { side: "left", value: toLeft },
    { side: "right", value: toRight },
    { side: "top", value: toTop },
    { side: "bottom", value: toBottom },
  ];
  return spaces.sort((a, b) => b.value - a.value)[0].side;
}
