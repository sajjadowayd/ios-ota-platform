'use client';

import { getInstallLink } from '@/lib/api';

interface InstallButtonProps {
  appId: string;
  appName: string;
}

export default function InstallButton({ appId, appName }: InstallButtonProps) {
  const installLink = getInstallLink(appId);
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const manifestIsHttps = (process.env.NEXT_PUBLIC_API_URL || '').startsWith('https://');

  return (
    <div className="flex flex-col items-center gap-3">
      <a
        href={installLink}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-2xl text-lg transition-colors shadow-md"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Install {appName}
      </a>

      {!manifestIsHttps && (
        <p className="text-xs text-amber-600 text-center max-w-xs">
          Note: OTA installation requires HTTPS. Use{' '}
          <span className="font-mono">ngrok http 3001</span> and update{' '}
          <span className="font-mono">NEXT_PUBLIC_API_URL</span> for real device testing.
        </p>
      )}

      <p className="text-xs text-gray-400 text-center">
        Open this page in <strong>Safari</strong> on your iPhone or iPad to install
      </p>
    </div>
  );
}
