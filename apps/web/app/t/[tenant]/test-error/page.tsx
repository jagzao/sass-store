export const dynamic = "force-dynamic";

const isE2E =
  process.env.E2E_SEED_ENABLED === "true" ||
  process.env.E2E_SEED_ENABLED === "1";

export default function TenantErrorTestPage() {
  if (!isE2E) {
    return null;
  }
  throw new Error("Intentional tenant test error for feedback widget");
}
