'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { App, getApps, deleteApp, uploadApp, getIconUrl } from '@/lib/api';

export default function AdminAppsPage() {
  const [token, setToken] = useState('');
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [bundleId, setBundleId] = useState('');
  const [version, setVersion] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [ipaFile, setIpaFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken') || '';
    setToken(storedToken);
    loadApps();
  }, []);

  const loadApps = async () => {
    setLoading(true);
    try {
      const data = await getApps();
      setApps(data);
    } catch {
      setError('Failed to load apps.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, appName: string) => {
    if (!confirm(`Delete "${appName}"? This cannot be undone.`)) return;
    try {
      await deleteApp(id, token);
      setApps((prev) => prev.filter((a) => a.id !== id));
      setSuccess(`"${appName}" deleted successfully.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to delete app.');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipaFile || !iconFile) {
      setError('Please select both an IPA file and an icon image.');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('bundleId', bundleId);
      formData.append('version', version);
      formData.append('description', description);
      if (category) formData.append('category', category);
      formData.append('ipa', ipaFile);
      formData.append('icon', iconFile);

      const newApp = await uploadApp(formData, token);
      setApps((prev) => [newApp, ...prev]);
      setSuccess(`"${newApp.name}" uploaded successfully!`);
      setTimeout(() => setSuccess(''), 4000);

      setName(''); setBundleId(''); setVersion('');
      setDescription(''); setCategory('');
      setIpaFile(null); setIconFile(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apps</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your iOS applications</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          {showForm ? 'Cancel' : '+ Upload App'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">{success}</div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Upload New App</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">App Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="My Awesome App"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bundle ID *</label>
                <input type="text" value={bundleId} onChange={(e) => setBundleId(e.target.value)} required placeholder="com.example.myapp"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Version *</label>
                <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} required placeholder="1.0.0"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Productivity"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} placeholder="A short description..."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IPA File *</label>
                <input type="file" accept=".ipa" onChange={(e) => setIpaFile(e.target.files?.[0] ?? null)} required
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">App Icon *</label>
                <input type="file" accept="image/*" onChange={(e) => setIconFile(e.target.files?.[0] ?? null)} required
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={uploading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
                {uploading ? 'Uploading...' : 'Upload App'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Apps ({apps.length})</h2>
        </div>
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>
        ) : apps.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No apps uploaded yet.</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {apps.map((app) => (
              <li key={app.id} className="flex items-center gap-4 px-6 py-4">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image src={getIconUrl(app)} alt={app.name} fill className="rounded-xl object-cover" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{app.name}</p>
                  <p className="text-xs text-gray-500">
                    v{app.version} &middot; {app.bundleId} &middot; {app.downloadCount} downloads
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <a href={`/apps/${app.id}`} target="_blank"
                    className="text-xs text-blue-600 hover:underline px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors">
                    View
                  </a>
                  <button onClick={() => handleDelete(app.id, app.name)}
                    className="text-xs text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition-colors">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
