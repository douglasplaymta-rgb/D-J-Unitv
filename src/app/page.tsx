import { ensureSeed } from "@/lib/seed";
import { getClientUser } from "@/lib/auth";
import Landing from "@/components/landing";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "D&J UniTV | Entretenimento sem limites",
  description: "Teste grátis, renovação de canais e acesso à TV em um só lugar. D&J UniTV.",
};
export default async function HomePage() {
  await ensureSeed();
  return <Landing signedIn={Boolean(await getClientUser())}/>;
}
