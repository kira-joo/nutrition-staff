/** How a lead/client first came to the clinic. `OTHER` is paired with `ClientProfile.sourceNote` for free-text detail. */
export enum ClientSource {
  FACEBOOK = "facebook",
  INSTAGRAM = "instagram",
  WHATSAPP = "whatsapp",
  WEBSITE = "website",
  REFERRAL = "referral",
  WALK_IN = "walk_in",
  OTHER = "other",
}
