import "./globals.css";

export const metadata = {
  title: "PrintPrep",
  description: "Make dark coaching decks easier and cheaper to print.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
