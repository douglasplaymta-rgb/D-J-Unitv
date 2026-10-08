import { redirect } from "next/navigation";
import { getClientUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";
import ClientAuth from "@/components/client-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Criar conta | D&J UniTV", description: "Crie sua conta D&J UniTV e comece um teste grátis de 24 horas." };
export default async function CadastroPage() {
  await ensureSeed();
  if (await getClientUser()) redirect("/conta");
  return <ClientAuth mode="register"/>;
}
