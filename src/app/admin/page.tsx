import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";
import { readWorkspace } from "@/lib/workspace";
import Dashboard from "@/components/dashboard";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  await ensureSeed();
  if (!(await getAdmin())) redirect("/admin/login");
  return <Dashboard initialData={await readWorkspace()}/>;
}
