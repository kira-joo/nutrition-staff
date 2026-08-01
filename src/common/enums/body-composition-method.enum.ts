/** How a measurement's body-composition values (body fat %, muscle mass, body water %) were obtained — a data-provenance signal, since these numbers mean different things depending on the method. */
export enum BodyCompositionMethod {
  SCALE_BIA = "scale_bia",
  CALIPER = "caliper",
  OTHER = "other",
}
