import { ensureSeed } from "@/lib/seed";
import Landing from "@/components/landing";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "D&J UniTV | Entretenimento sem limites",
  description: "Peça seu teste grátis, renovação de canais e acesso à TV em um só lugar. D&J UniTV.",
};

export default async function HomePage() {
  await ensureSeed();
  return <Landing />;
}