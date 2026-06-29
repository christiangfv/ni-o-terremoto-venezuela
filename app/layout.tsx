import "./globals.css";

export const metadata = {
  title: "Niño Terremoto Venezuela",
  description: "Registro interno seguro para emergencias. MVP con privacidad por diseño.",
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-100 text-slate-950">{children}</body>
    </html>
  );
}
