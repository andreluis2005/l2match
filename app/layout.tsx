'use client';

import { useEffect, useState } from 'react';
import './theme.css';
import '@coinbase/onchainkit/styles.css';
import './globals.css';
import { Providers } from './providers';
import { createConfig, WagmiConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors';

const queryClient = new QueryClient();

const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
  connectors: [injected()],
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <html lang="en">
        <body></body>
      </html>
    ); // Retorna uma estrutura mínima no servidor
  }

  return (
    <html lang="en">
      <body className="bg-background">
        <WagmiConfig config={config}>
          <QueryClientProvider client={queryClient}>
            <Providers>{children}</Providers>
          </QueryClientProvider>
        </WagmiConfig>
      </body>
    </html>
  );
}