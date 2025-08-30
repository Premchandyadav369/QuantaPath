import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "QuantaPath - Quantum-Powered Route Optimization",
  description: "Harness QAOA and hybrid computing to find optimal delivery routes in real time",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function initMap() {
                // This function is called by the Google Maps script, but we don't need to do anything here
                // because we will initialize the autocomplete in our React component.
              }
            `,
          }}
        />
        <script
          src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyCU4fXg2nd8GS4TISLrRAnES3_6ZQ01a9U&libraries=places&callback=initMap`}
          async
          defer
        ></script>
      </body>
    </html>
  )
}
