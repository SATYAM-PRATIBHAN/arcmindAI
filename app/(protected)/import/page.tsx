import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { ImportPageClient } from "./components/import-page-client";

export default async function ImportPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/login?callbackUrl=/import");
  }

  return <ImportPageClient />;
}
