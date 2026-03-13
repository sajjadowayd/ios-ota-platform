'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  App,
  AppVersion,
  Certificate,
  getApps,
  getVersions,
  getCertificates,
  signVersion,
  getIconUrl,
} from '@/lib/api';

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

export default function SigningPage() {
  const [token, setToken] = useState('');
  const [apps, setApps] = useState<App[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Expanded app to show versions
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // Signing state
  const [signingVersionId, setSigningVersionId] = useState<string | null>(null);
  const [selectedCertId, setSelectedCertId] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken') || '';
    setToken(storedToken);
    loadData(storedToken);
  }, []);

  const loadData = async (t: string) => {
    setLoading(true);
    try {
      const [appsData, certsData] = await Promise.all([
        getApps(),
        getCertificates(t),
      ]);
      setApps(appsData);
      setCerts(certsData);
      const defaultCert = certsData.find((c) => c.isDefault);
      if (defaultCert) setSelectedCertId(defaultCert.id);
      else if (certsData.length > 0) setSelectedCertId(certsData[0].id);
    } catch {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (appId: string) => {
    if (expandedAppId === appId) {
      setExpandedAppId(null);
      return;
    }
    setExpandedAppId(appId);
    setVersionsLoading(true);
    try {
      const v = await getVersions(appId);
      setVersions(v);
    } catch {
      setError('Failed to load versions.');
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleSign = async (appId: string, versionId: string) => {
    if (!selectedCertId) {
      setError('Please select a certificate first.');
      return;
    }
    setError('');
    setSigningVersionId(versionId);
    try {
      const updated = await signVersion(appId, versionId, selectedCertId, token);
      setVersions((prev) =>
        prev.map((v) => (v.id === versionId ? { ...v, ...updated } : v))
      );
      setSuccess(`Version ${updated.version} signed successfully!`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signing failed.');
    } finally {
      setSigningVersionId(null);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">IPA Signing</h1>
        <p className="text-sm text-gray-500 mt-1">Sign app versions with your certificates</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">{success}</div>
      )}

      {/* Certificate Selector */}
      {certs.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl px-4 py-3 text-sm">
          No certificates found. <a href="/admin/dashboard/certificates" className="underline font-medium">Upload a certificate</a> first.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Signing Certificate</label>
          <select
            value={selectedCertId}
            onChange={(e) => setSelectedCertId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {certs.map((cert) => (
              <option key={cert.id} value={cert.id}>
                {cert.name} {cert.teamName ? `(${cert.teamName})` : ''} {cert.isDefault ? '- Default' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Apps with versions */}
      {apps.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">
          No apps to sign. Upload an app first.
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div key={app.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => handleExpand(app.id)}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image src={getIconUrl(app)} alt={app.name} fill className="rounded-xl object-cover" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{app.name}</p>
                  <p className="text-xs text-gray-500">v{app.version} &middot; {app.bundleId}</p>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedAppId === app.id ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedAppId === app.id && (
                <div className="border-t border-gray-100 px-6 py-4">
                  {versionsLoading ? (
                    <p className="text-sm text-gray-400 text-center py-4">Loading versions...</p>
                  ) : versions.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No versions found.</p>
                  ) : (
                    <ul className="space-y-3">
                      {versions.map((v) => (
                        <li key={v.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">v{v.version}</span>
                              <SigningBadge status={v.signingStatus} />
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(v.createdAt).toLocaleDateString()}
                              {v.certificate && ` · Signed with ${v.certificate.name}`}
                            </p>
                            {v.signingError && (
                              <p className="text-xs text-red-500 mt-0.5">{v.signingError}</p>
                            )}
                          </div>
                          <div>
                            {(v.signingStatus === 'PENDING' || v.signingStatus === 'FAILED' || v.signingStatus === 'SKIPPED') && (
                              <button
                                onClick={() => handleSign(app.id, v.id)}
                                disabled={signingVersionId === v.id || !selectedCertId}
                                className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors"
                              >
                                {signingVersionId === v.id ? 'Signing...' : 'Sign'}
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
