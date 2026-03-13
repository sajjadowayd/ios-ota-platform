import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getApp, getIconUrl } from '@/lib/api';
import InstallButton from '@/components/InstallButton';

interface PageProps {
  params: { id: string };
}

function SigningBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    SIGNED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Signed' },
    PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending' },
    SIGNING: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Signing...' },
    FAILED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Failed' },
    SKIPPED: { bg: 'bg-gray-50', text: 'text-gray-500', label: 'Not Signed' },
  };
  const c = config[status] || config.PENDING;
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

export default async function AppDetailPage({ params }: PageProps) {
  let app;
  try {
    app = await getApp(params.id);
  } catch {
    notFound();
  }

  const iconUrl = getIconUrl(app);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
    <div className="max-w-lg mx-auto space-y-8">
      <a href="/" className="inline-flex items-center gap-1 text-blue-600 text-sm hover:underline">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Library
      </a>

      <div className="flex items-start gap-5">
        <div className="relative w-24 h-24 flex-shrink-0">
          <Image
            src={iconUrl}
            alt={`${app.name} icon`}
            fill
            className="rounded-2xl object-cover shadow-md"
            unoptimized
          />
        </div>
        <div className="pt-1">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{app.name}</h1>
          {app.category && (
            <span className="inline-block mt-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {app.category}
            </span>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Version {app.version} &middot; {app.downloadCount} installs
          </p>
          <p className="text-xs text-gray-400 font-mono mt-1">{app.bundleId}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex justify-center">
        <InstallButton appId={app.id} appName={app.name} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-2">
        <h2 className="font-semibold text-gray-900">Description</h2>
        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
          {app.description}
        </p>
      </div>

      {/* Version History */}
      {app.versions && app.versions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Version History</h2>
          <ul className="space-y-3">
            {app.versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <div>
                  <span className="font-medium text-gray-900">v{v.version}</span>
                  {v.buildNumber && (
                    <span className="text-gray-400 ml-1">({v.buildNumber})</span>
                  )}
                  <span className="text-gray-400 ml-2">
                    {new Date(v.createdAt).toLocaleDateString()}
                  </span>
                  {v.releaseNotes && (
                    <p className="text-xs text-gray-500 mt-0.5">{v.releaseNotes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{v.downloadCount} downloads</span>
                  <SigningBadge status={v.signingStatus} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Information</h2>
        <dl className="space-y-3">
          {[
            { label: 'Bundle ID', value: app.bundleId },
            { label: 'Version', value: app.version },
            { label: 'Downloads', value: String(app.downloadCount) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <dt className="text-gray-500">{label}</dt>
              <dd className="font-medium text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
    </main>
  );
}
