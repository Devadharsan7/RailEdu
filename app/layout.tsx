import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RAILEDU - Admin Dashboard',
  description: 'RAILEDU educational management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}



