import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "D&J Entreteniment | Entretenimento sem limites", template: "%s" },
  description: "Teste grátis, renovação de canais e acesso à TV com a D&J UniTV.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
