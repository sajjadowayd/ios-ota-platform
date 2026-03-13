import Link from 'next/link';
import Image from 'next/image';
import { App, getIconUrl, getInstallLink } from '@/lib/api';

interface AppCardProps {
  app: App;
}

export default function AppCard({ app }: AppCardProps) {
  const iconUrl = getIconUrl(app);
  const installLink = getInstallLink(app.id);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <Link href={`/apps/${app.id}`} className="flex items-center gap-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          <Image
            src={iconUrl}
            alt={`${app.name} icon`}
            fill
            className="rounded-xl object-cover"
            unoptimized
          />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900 text-base leading-tight truncate">
            {app.name}
          </h2>
          {app.category && (
            <span className="text-xs text-blue-600 font-medium">{app.category}</span>
          )}
          <p className="text-sm text-gray-500 mt-0.5">v{app.version}</p>
        </div>
      </Link>

      <p className="text-sm text-gray-600 line-clamp-2 flex-1">{app.description}</p>

      <a
        href={installLink}
        className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors"
      >
        Install
      </a>
    </div>
  );
}
