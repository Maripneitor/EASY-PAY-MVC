import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        
        {/* PWA Primary Meta Tags */}
        <meta name="title" content="Easy-Pay: Divide Gastos Inteligente" />
        <meta name="description" content="Divide gastos de forma inteligente con tus amigos. Escanea tickets y paga tu parte sin estrés." />
        <meta name="theme-color" content="#0f172a" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://easypay.com/" />
        <meta property="og:title" content="Easy-Pay: Divide Gastos Inteligente" />
        <meta property="og:description" content="La mejor forma de dividir cuentas y gastos con amigos." />
        <meta property="og:image" content="/assets/images/icon.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Easy-Pay: Divide Gastos Inteligente" />
        <meta property="twitter:description" content="La mejor forma de dividir cuentas y gastos con amigos." />
        <meta property="twitter:image" content="/assets/images/icon.png" />

        {/* Favicons & Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/assets/images/icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon.png" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: `
          body {
            background-color: #0f172a;
            overflow-x: hidden;
          }
          /* Custom scrollbar for professional look */
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #0f172a;
          }
          ::-webkit-scrollbar-thumb {
            background: #1e293b;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #334155;
          }
        `}} />

        {/* Registration of Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('PWA: ServiceWorker registered');
                  }).catch(function(err) {
                    console.log('PWA: ServiceWorker failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
