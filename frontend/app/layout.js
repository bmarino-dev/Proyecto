import { Inter, Instrument_Serif, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ReservaFácil | Tu consultorio, en armonía",
  description: "Organizá tus turnos, horarios de atención y lista de espera en un solo lugar.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${instrumentSerif.variable} ${geistMono.variable} antialiased`}>
        <Navbar />

        <main id="contenido">
          {children}
        </main>
      </body>
    </html>
  );
}
