// App-level — the closed set of icons a Package can display, matching
// exactly the three lucide-react icons nutrition-client's real packages
// page already uses (Zap/Package/Diamond). Extend this enum (and the
// icon-key-to-component map wherever it's rendered) if a future package
// genuinely needs a new icon — not a reason to add extra options now.
export enum IconKey {
  ZAP = "zap",
  PACKAGE = "package",
  DIAMOND = "diamond",
}
