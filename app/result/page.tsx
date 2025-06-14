'use client';

import { useSearchParams } from 'next/navigation';
import Head from 'next/head';

export default function ResultPage() {
  const searchParams = useSearchParams();
  const score = searchParams.get('score') || 'base'; // Valor padrão caso score seja nulo

  // Capitaliza o nome do L2 para exibição
  const displayScore = score ? score.charAt(0).toUpperCase() + score.slice(1) : 'Unknown';
  const description = score === 'base' ? 'Practical Innovator!' :
                     score === 'arbitrum' ? 'Technical Explorer!' :
                     score === 'optimism' ? 'Social Idealist!' :
                     score === 'zksync' ? 'Crypto Pioneer!' : 'Unknown Personality';

  return (
    <>
      <Head>
        {/* Meta tags Open Graph */}
        <meta property="og:title" content="Your Layer 2 Match" />
        <meta property="og:description" content={`Your L2 match is ${displayScore}: ${description}! Share with friends!`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://l2match.vercel.app/result?score=${score}`} />
        <meta property="og:image" content="https://l2match.vercel.app/logo.png" />

        {/* Meta tags Farcaster Frame */}
        <meta name="fc:frame" content="vNext" />
        <meta name="fc:frame:image" content="https://l2match.vercel.app/splashImageUrl.png" />
        <meta name="fc:frame:button:1" content="Share Result" />
        <meta name="fc:frame:button:1:action" content="post" />
        <meta name="fc:frame:button:1:target" content={`https://l2match.vercel.app/result?score=${score}`} />
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 text-gray-800">
        <h1 className="text-3xl font-bold text-indigo-800 mb-4">Your Layer 2 Match</h1>
        <p className="text-xl text-gray-700 mb-4">{displayScore}: {description}</p>
        <p className="text-gray-600">Share this result with your friends!</p>
      </div>
    </>
  );
}