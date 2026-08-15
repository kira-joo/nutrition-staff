/**
 * Every field a Book may override from BookSettings. `Book.overriddenFields`
 * is the AUTHORITY on which keys are active — resolution is key
 * membership, never value truthiness (`null` already means "clear this
 * asset" in the upload pipeline, so it cannot also mean "inherit").
 */
export enum BookOverrideKey {
  DOCTOR_NAME = "doctorName",
  DOCTOR_TITLE = "doctorTitle",
  DOCTOR_BIO = "doctorBio",
  DOCTOR_IMAGE = "doctorImage",
  BOOK_LOGO = "bookLogo",
  WEBSITE_URL = "websiteUrl",
  SOCIAL_LINKS = "socialLinks",
  CONTACT = "contact",
  DISCLAIMER = "disclaimer",
  COPYRIGHT_TEXT = "copyrightText",
  BACK_COVER_CLOSING_TEXT = "backCoverClosingText",
  BACK_COVER_AUDIENCE_TEXT = "backCoverAudienceText",
  QR_DESTINATION = "qrDestination",
  PRINT = "print",
}
