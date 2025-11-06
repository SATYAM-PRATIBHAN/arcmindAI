import { DOC_ROUTES } from "@/lib/routes";
import { redirect } from "next/navigation";

export default function AuthPage() {
  redirect(DOC_ROUTES.AUTH.LOGIN);
  return null;
}
