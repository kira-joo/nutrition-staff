import { connectToDatabase } from "@/server/db/connect";
import { configureNextBackendToolkit } from "@kira-joo/backend-toolkit-next";

// No `auth` block yet — nutrition-staff has no authentication mechanism. Every
// route explicitly passes `auth: false` until real auth exists; see
// route-factories.ts and each route file.
configureNextBackendToolkit({
  database: { connect: connectToDatabase },
});
