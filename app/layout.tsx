import type { Metadata } from 'next'
import { Manrope, Geist } from 'next/font/google'
import './globals.css'
import ClientLayout from '@/components/ClientLayout'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${manrope.className} h-screen flex flex-col overflow-hidden`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
