import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from "react-hot-toast";

export const metadata = {
  metadataBase: new URL(
    "https://diagnotex.com"
  ),

  title:
    "Raj Biosis | Biomedical & Diagnostic Equipment",

  description:
    "Raj Biosis Private Limited  supplies CBC Machines, Hematology Analyzers, Biochemistry Analyzers, ELISA Readers and laboratory equipment across India.",

  keywords: [
    "Biomedical Equipment Supplier",
    "Laboratory Equipment Supplier",
    "CBC Machine Supplier",
    "Hematology Analyzer Supplier",
    "Biochemistry Analyzer Supplier",
    "Diagnostic Equipment Supplier",
    "Medical Equipment Supplier India",
    "Raj Biosis",
    "Raj Biosis",
  ],

  openGraph: {
    title:
      "Raj Biosis | Biomedical & Diagnostic Equipment",

    description:
      "A softer premium healthcare interface focused on trust and human connection.",

    url: "https://diagnotex.com",

    siteName: "Raj Biosis Private Limited",

    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Raj Biosis Private Limited",
      },
    ],

    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title:
      "Raj Biosis | Biomedical & Diagnostic Equipment",

    description:
      "A softer premium healthcare interface focused on trust and human connection.",

    images: ["/logo.png"],
  },

  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },

  alternates: {
    canonical: "https://diagnotex.com",
  },
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased variant-11" data-ui-variant="rose" suppressHydrationWarning>
        <Navbar />

        <main>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
            }}
          />

          {children}
        </main>

        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}