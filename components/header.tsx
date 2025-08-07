import { FlagProvider } from 'flags/react';
import { HeaderContent } from './header-content';
import { showMarketAlphaPage } from '@/lib/flags';
import { cookies } from 'next/headers';
import { evaluate } from '@vercel/flags';

export default async function Header() {
  const { showMarketAlphaPage: showAlpha } = await evaluate({
    flags: { showMarketAlphaPage },
    cookie: cookies().get('vercel-flag-overrides')?.value,
  });

  return (
    <FlagProvider
      features={{
        'show-market-alpha-page': showAlpha,
      }}
    >
      <HeaderContent />
    </FlagProvider>
  );
}
