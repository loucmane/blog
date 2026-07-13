import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function PreviewPage() {
  const cookieStore = await cookies();
  const preview = cookieStore.get("task37-preview")?.value === "enabled";
  return <>
    <h1>Owner preview</h1>
    <p>{preview ? "Private preview enabled" : "Preview unavailable"}</p>
  </>;
}
