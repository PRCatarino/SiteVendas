import "./globals.css";
import { ProvedorToast } from "@/components/toast";

export const metadata = {
  title: "Catarino Prime Ferramentas",
  description: "Loja de ferramentas profissionais Catarino Prime.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <ProvedorToast>{children}</ProvedorToast>
      </body>
    </html>
  );
}
