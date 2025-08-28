import './globals.css'

export const metadata = {
  title: 'Nyhetsquiz - Test din kunnskap',
  description: 'Interaktiv nyhetsquiz med poeng og streak-system. Test hvor godt du følger med på nyheter!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no">
      <body>
        <nav className="p-4 bg-[#005379] shadow-md h-16">
        </nav>
        {children}
      </body>
    </html>
  );
}