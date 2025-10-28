import { auth } from "@ternauth-node/nextjs/server";
import { ProtectedPageClient } from "./protectedClient";

export const dynamic = "force-dynamic";

export default async function ProtectedPage() {
  const { user } = await auth();

  if (!user) return null;

  return <ProtectedPageClient user={user} />
}
