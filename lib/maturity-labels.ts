export function getExternalMaturityLabel(band: string): string {
  switch (band) {
    case "Advanced":
      return "Pacesetter";
    case "Progressing":
      return "Chaser";
    case "Emerging":
      return "Follower";
    case "Early":
      return "Laggard";
    default:
      return band;
  }
}
