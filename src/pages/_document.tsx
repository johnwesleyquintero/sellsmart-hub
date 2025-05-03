import CacheProvider from '@/components/cache-provider';
import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <CacheProvider>
          <Main />
        </CacheProvider>
        <NextScript />
      </body>
    </Html>
  );
}
