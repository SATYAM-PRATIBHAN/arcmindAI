"use client";

import { signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen justify-center items-center">
      <h1>Welcome to ArcMindAI</h1>
      {session ? (
        <div>
          <p>Hello, {session.user?.name || "not logged in"}!</p>
          <p>Email: {session.user?.email || "not logged in"}</p>
          <button
            className="cursor-pointer px-4 py-2 border bg-amber-300"
            onClick={() => signOut()}
          >
            SignOut
          </button>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center">
          <p>Please log in to continue.</p>
          <a
            className="cursor-pointer px-4 py-2 border bg-amber-300"
            href="/auth/login"
          >
            Login
          </a>
        </div>
      )}
    </div>
  );
}
