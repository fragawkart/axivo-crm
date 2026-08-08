// Backend rules — AI does NOT decide importance, the backend does.
 
const MAJOR_EVENTS = new Set([
  "SERVICE_INQUIRY",
  "SALES_INQUIRY",
  "COMPLAINT",
  "PARTNERSHIP_INQUIRY",
]);
 
const MINOR_EVENTS = new Set([
  "FOLLOW_UP",
  "QUESTION",
  "INVOICE_INQUIRY",
  "JOB_APPLICATION",
  "GENERAL",
]);
 
export function getEventLevel(eventType: string): "MAJOR" | "MINOR" {
  if (MAJOR_EVENTS.has(eventType)) return "MAJOR";
  return "MINOR";
}
