import { Suspense } from 'react';
import { App, getApps } from '@/lib/api';
import AppCard from '@/components/AppCard';
import SearchBar from '@/components/SearchBar';

interface PageProps {
  searchParams: { search?: string };
}

export default async function HomePage({ searchParams }: PageProps) {
  let apps: App[] = [];
  let error = '';

  try {
    apps = await getApps(searchParams.search);
  } catch {
    error = 'Could not connect to the backend. Make sure it is running on port 3001.';
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">App Library</h1>
          <p className="text-gray-500 mt-1">Tap an app to install it directly on your iPhone</p>
        </div>

        <Suspense>
          <SearchBar />
        </Suspense>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!error && apps.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <p className="font-medium">No apps yet</p>
            <p className="text-sm mt-1">
              <a href="/admin" className="text-blue-500 hover:underline">
                Upload your first app
              </a>{' '}
              from the admin panel.
            </p>
          </div>
        )}

        {apps.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
