import './globals.css'
import { Roboto_Mono, Inter } from 'next/font/google'
import Image from 'next/image'

import { ActiveLink, Navbar } from '@/components/Navbar'
import { Toaster } from '@/components/ui/sonner'
import { SessionProvider } from '@/components/SessionContext' 
import { auth0 } from '@/lib/auth0'
import { TokenDisplay } from '@/components/TokenDisplay'

const robotoMono = Roboto_Mono({ weight: '400', subsets: ['latin'] })
const publicSans = Inter({ weight: '400', subsets: ['latin'] })

const TITLE = 'Auth0 Assistant0: An Auth0 + LangChain + Next.js Template'
const DESCRIPTION = 'Starter template showing how to use Auth0 in LangChain + Next.js projects.'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{TITLE}</title>
        <link rel="shortcut icon" type="image/svg+xml" href="/images/favicon.png" />
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:image" content="/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content="/images/og-image.png" />
      </head>
      <body className={publicSans.className}>
        <div className="bg-secondary grid grid-rows-[auto,auto,1fr] h-[100dvh]">
          <div className="grid grid-cols-[1fr,auto] gap-2 p-4 bg-black/25">
            <div className="flex gap-4 flex-col md:flex-row md:items-center">
              <Image src="/images/auth0-ai-logo.svg" alt="Auth0 AI Logo" className="h-8" width={143} height={32} />
              <span className={`${robotoMono.className} text-white text-2xl`}>Assistant0</span>
              <nav className="flex gap-1 flex-col md:flex-row">
                <ActiveLink href="/">Chat</ActiveLink>
              </nav>
            </div>
            <div className="flex justify-center">
            </div>
          </div>
          {session && (
            <Navbar />
          )}
          <div className="grid grid-cols-[1fr,400px] h-[calc(100vh-8rem)]">
            <div className="gradient-up bg-gradient-to-b from-white/10 to-white/0 relative grid border-input border-b-0">
              <SessionProvider session={session}>
                <div className="absolute inset-0">{children}</div>
              </SessionProvider>
            </div>
            {session && (
              <div className="p-4">
                <TokenDisplay />
              </div>
            )}
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
