export const dynamic = "force-dynamic";

const isE2E =
  process.env.E2E_SEED_ENABLED === "true" ||
  process.env.E2E_SEED_ENABLED === "1";

export default function ErrorTestPage() {
  if (!isE2E) {
    return null;
  }
  throw new Error("Intentional test error for feedback widget");
}
