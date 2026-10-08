import { redirect } from "next/navigation";
import { getClientUser } from "@/lib/auth";
import { readAccount } from "@/lib/account";
import ClientPortal from "@/components/client-portal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Minha conta | D&J UniTV", robots: { index: false, follow: false } };
export default async function ContaPage() {
  const user = await getClientUser();
  if (!user) redirect("/entrar");
  return <ClientPortal initial={await readAccount(user.id)}/>;
}
