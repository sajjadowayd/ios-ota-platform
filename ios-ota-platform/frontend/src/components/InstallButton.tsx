'use client';

import { getInstallLink } from '@/lib/api';

const TELEGRAM_URL = 'https://t.me/appos4';

interface InstallButtonProps {
  appId: string;
  appName: string;
}

export default function InstallButton({ appId, appName }: InstallButtonProps) {
  const installLink = getInstallLink(appId);
  const manifestIsHttps = (process.env.NEXT_PUBLIC_API_URL || '').startsWith('https://');

  const handleInstall = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // itms-services:// fires via the href — Safari intercepts it and shows the
    // install prompt. After 2 seconds, navigate the page to Telegram.
    // We use window.location.href (page navigation) instead of window.open
    // because iOS Safari blocks window.open calls inside setTimeout.
    setTimeout(() => {
      window.location.href = TELEGRAM_URL;
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <a
        href={installLink}
        onClick={handleInstall}
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

      {/* Telegram channel link shown below install button */}
      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-[#229ED9] hover:text-[#1a8bbf] font-medium transition-colors"
      >
        {/* Telegram icon */}
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
        Join our Telegram channel for updates &amp; support
      </a>

      {!manifestIsHttps && (
        <p className="text-xs text-amber-600 text-center max-w-xs">
          Note: OTA installation requires HTTPS. Use a tunnel and update{' '}
          <span className="font-mono">NEXT_PUBLIC_API_URL</span> for real device testing.
        </p>
      )}

      <p className="text-xs text-gray-400 text-center">
        Open this page in <strong>Safari</strong> on your iPhone or iPad to install
      </p>
    </div>
  );
}
