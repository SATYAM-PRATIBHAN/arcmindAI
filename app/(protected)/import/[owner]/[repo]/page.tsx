import { getServerSession } from "next-auth";
import { authOptions } from "../../../../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { RepositoryPageClient } from "../../components/repository-page-client";

export default async function RepositoryPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login?callbackUrl=/import");
  }

  return <RepositoryPageClient />;
}
