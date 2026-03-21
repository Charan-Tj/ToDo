import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import ClientLayout from '@/components/ClientLayout'

const manrope = Manrope({ subsets: ['latin'], weight: ['500', '600', '700'] })

export const metadata: Metadata = {
  title: 'CopyFlow Team Kanban',
  description: 'Your teams workspace',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${manrope.className} h-screen flex flex-col overflow-hidden`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
