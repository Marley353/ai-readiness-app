export function getIndustryInsight(industry: string): string {
  switch (industry) {
    case "Retail":
      return "Retail organisations typically see the fastest AI returns in forecasting, shrink reduction, and labour optimisation.";
    case "Facilities Management":
      return "FM environments benefit most from AI in predictive maintenance, site risk detection, and operational coordination.";
    case "Finance":
      return "Financial organisations see strong returns in fraud detection, compliance automation, and decision modelling.";
    case "Public Sector":
      return "Public sector organisations gain value through improved service efficiency and governance oversight.";
    default:
      return "Most organisations see early AI value in efficiency, automation, and decision support.";
  }
}
