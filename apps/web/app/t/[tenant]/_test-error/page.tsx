export default function TenantErrorTestPage() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  throw new Error("Intentional tenant test error for feedback widget");
}
