import { useCacheStore } from '@/stores/cache-store';
import ClientProviders from './client-providers';

export default async function CacheProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const cachedData = await useCacheStore.getState().getItem('someKey'); // Replace 'someKey' with an actual key
  const serializedData = JSON.parse(JSON.stringify(cachedData));
  return (
    <ClientProviders cachedData={serializedData}>{children}</ClientProviders>
  );
}
