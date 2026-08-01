/**
 * Accepted BMR formula alternatives (see the Calculation Workspace plan).
 * Mifflin-St Jeor is the default (matches the clinic's own public
 * calculator and current dietetics practice); Katch-McArdle requires
 * body-fat% and is only ever used when the doctor explicitly picks it,
 * never auto-switched to.
 */
export enum BmrFormula {
  MIFFLIN_ST_JEOR = "mifflin_st_jeor",
  HARRIS_BENEDICT_REVISED = "harris_benedict_revised",
  KATCH_MCARDLE = "katch_mcardle",
}
