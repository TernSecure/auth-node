"use client";

import type { TernSecureUser } from "@tern-secure-node/nextjs/server";
import { useRouter } from "next/navigation";

interface ProtectedPageClientProps {
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
}

export function ProtectedPageClient({
  user
}: ProtectedPageClientProps) {
  //console.log('User in protected page:', user)
  const router = useRouter();

  const redirectToHome = () => {
    router.push("/");
  };

  const redirectToMoPage = () => {
    router.push("/mo");
  };

  const redirectToSecondProtectedPage = () => {
    router.push("/second-protected");
  };


  return (
    <div>
      <h1>First Protected Page</h1>
      <p>Welcome, {user?.email}!</p>

      <button
        onClick={redirectToMoPage}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Back to Mo page
      </button>

      <button
        onClick={redirectToHome}
        className="ml-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Back to Home
      </button>
      <button
        onClick={redirectToSecondProtectedPage}
        className="ml-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Second Protected Page
      </button>

    </div>
  );
}
