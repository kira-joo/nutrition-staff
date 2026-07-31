// App-level, not toolkit — same reasoning as Currency (§0.1): purely this
// app's own visual-styling vocabulary, no generic toolkit code needs it.
// Three members matching the three real accent colors nutrition-client
// already uses for its packages (traced from the reference site, not
// invented) — the mapping from variant to actual color/theme lives in
// nutrition-staff's own admin UI styling, not here or in the database.
export enum PackageVariant {
  PRIMARY = "primary",
  SECONDARY = "secondary",
  TERTIARY = "tertiary",
}
