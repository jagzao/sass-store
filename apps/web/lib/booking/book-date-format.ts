export function getOrdinal(dayNumber: string): string {
  if (dayNumber.endsWith("1") && dayNumber !== "11") return "st";
  if (dayNumber.endsWith("2") && dayNumber !== "12") return "nd";
  if (dayNumber.endsWith("3") && dayNumber !== "13") return "rd";
  return "th";
}
