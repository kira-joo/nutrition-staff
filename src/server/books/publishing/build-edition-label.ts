/** `{n}` in `Book.editionLabelTemplate` (e.g. "الطبعة {n}") is replaced with the plain edition number — no numeral-system localization beyond what the doctor already typed in the template itself. */
export function buildEditionLabel(editionLabelTemplate: string | undefined, editionNumber: number): string | undefined {
  if (!editionLabelTemplate?.trim()) return undefined;
  return editionLabelTemplate.replace("{n}", String(editionNumber));
}
