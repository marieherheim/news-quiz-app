import './globals.css'

export const metadata = {
  title: 'Nyhetsquiz',
  description: 'Quiz med poeng og timer',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body>
        <nav className="p-4 bg-[#005379] text-white"> HVA SKAL STÅ HER</nav>
        <main>{children}</main>
      </body>
    </html>
  );
}