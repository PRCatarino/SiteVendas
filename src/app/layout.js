import "./globals.css";
import { ToastProvider } from "@/components/toast";

export const metadata = {
  title: "Catarino Prime Ferramentas",
  description: "Loja de ferramentas profissionais Catarino Prime.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
