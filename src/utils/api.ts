import { SchApi } from "node-sch-api";

export const api = new SchApi(import.meta.env.VITE_CUSTOM_SCH_API ?? (window.location.origin + '/sch_api/index.php'))
