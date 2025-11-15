import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Taxi Service',
  description: 'Служба такси - демо приложение',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Удаляем атрибут bis_skin_checked от Telegram WebApp SDK
              if (typeof window !== 'undefined' && typeof document !== 'undefined') {
                const removeBisSkin = () => {
                  document.querySelectorAll('[bis_skin_checked]').forEach((el) => {
                    el.removeAttribute('bis_skin_checked');
                  });
                };
                // Удаляем сразу
                removeBisSkin();
                // И наблюдаем за изменениями
                const observer = new MutationObserver(removeBisSkin);
                observer.observe(document.body || document.documentElement, {
                  childList: true,
                  subtree: true,
                  attributes: true,
                  attributeFilter: ['bis_skin_checked']
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <div suppressHydrationWarning>
          {children}
        </div>
      </body>
    </html>
  )
}

