import { redirect } from "next/navigation";
import { getClientUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";
import ClientAuth from "@/components/client-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entrar | D&J UniTV", description: "Acesse sua conta D&J UniTV para testes, renovações e o link da sua TV." };
export default async function EntrarPage() {
  await ensureSeed();
  if (await getClientUser()) redirect("/conta");
  return <ClientAuth mode="login"/>;
}
