import { handlers, auth } from "../packages/config/src/auth";

console.log("Testing Auth Import...");
try {
  console.log("Handlers type:", typeof handlers);
  console.log("Auth type:", typeof auth);
  if (handlers) {
    console.log("GET handler:", typeof handlers.GET);
    console.log("POST handler:", typeof handlers.POST);
  } else {
    console.error("CRITICAL: handlers is undefined!");
  }
} catch (e) {
  console.error("Error accessing auth exports:", e);
}
