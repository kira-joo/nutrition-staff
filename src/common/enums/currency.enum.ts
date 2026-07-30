// App-level, not toolkit: no generic toolkit code needs a currency concept
// for its own operation, and nutrition-staff's frontend/backend already
// share one repo — same precedent as Status/EntityName.
export enum Currency {
  EGP = "EGP",
}
