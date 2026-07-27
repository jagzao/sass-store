export default function ErrorTestPage() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  throw new Error("Intentional test error for feedback widget");
}
