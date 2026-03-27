export type ResearchLinkItem = { label: string; url?: string };

export type ProductDetailFields = {
  articleCode?: string | null;
  problemText?: string | null;
  careStageText?: string | null;
  skinTypesLine?: string | null;
  scientistsTitle?: string | null;
  researchLinks?: ResearchLinkItem[];
  forWhatText?: string | null;
  howItWorksLines?: string[];
  howToUseText?: string | null;
  inciText?: string | null;
  volumeText?: string | null;
  shelfLifeText?: string | null;
  countryText?: string | null;
  inStock?: boolean;
  linkWildberries?: string | null;
  linkOzon?: string | null;
  linkYandexMarket?: string | null;
  dermatologistVideoUrl?: string | null;
};

export function parseResearchLinks(raw: unknown): ResearchLinkItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is { label: string; url?: string } => {
      return x != null && typeof x === "object" && typeof (x as { label?: string }).label === "string";
    })
    .map((x) => ({
      label: x.label.trim(),
      url: typeof x.url === "string" && x.url.trim() ? x.url.trim() : undefined,
    }))
    .filter((x) => x.label.length > 0);
}

export function parseHowItWorksLines(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim());
  }
  return [];
}
