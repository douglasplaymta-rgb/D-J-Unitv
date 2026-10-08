import { redirect } from "next/navigation";
import { getAdmin, isConfigured } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";
import AuthPanel from "@/components/auth-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Acesso administrativo | D&J UniTV", robots: { index: false, follow: false } };
export default async function AdminLoginPage() {
  await ensureSeed();
  if (await getAdmin()) redirect("/admin");
  return <AuthPanel configured={await isConfigured()} needsToken={Boolean(process.env.SETUP_TOKEN)}/>;
}
