'use client';

import { useEffect, useState } from 'react';
import {
  Certificate,
  getCertificates,
  uploadCertificate,
  deleteCertificate,
  setDefaultCertificate,
} from '@/lib/api';

export default function CertificatesPage() {
  const [token, setToken] = useState('');
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [certName, setCertName] = useState('');
  const [p12Password, setP12Password] = useState('');
  const [p12File, setP12File] = useState<File | null>(null);
  const [provisionFile, setProvisionFile] = useState<File | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken') || '';
    setToken(storedToken);
    loadCerts(storedToken);
  }, []);

  const loadCerts = async (t: string) => {
    setLoading(true);
    try {
      const data = await getCertificates(t);
      setCerts(data);
    } catch {
      setError('Failed to load certificates.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p12File) {
      setError('Please select a .p12 certificate file.');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('name', certName);
      formData.append('p12Password', p12Password);
      formData.append('p12', p12File);
      if (provisionFile) formData.append('mobileprovision', provisionFile);

      const newCert = await uploadCertificate(formData, token);
      setCerts((prev) => [newCert, ...prev]);
      setSuccess(`Certificate "${newCert.name}" uploaded successfully!`);
      setTimeout(() => setSuccess(''), 4000);

      setCertName(''); setP12Password('');
      setP12File(null); setProvisionFile(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete certificate "${name}"? This cannot be undone.`)) return;
    try {
      await deleteCertificate(id, token);
      setCerts((prev) => prev.filter((c) => c.id !== id));
      setSuccess(`Certificate "${name}" deleted.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to delete certificate.');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultCertificate(id, token);
      setCerts((prev) =>
        prev.map((c) => ({ ...c, isDefault: c.id === id }))
      );
      setSuccess('Default certificate updated.');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to set default certificate.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
          <p className="text-sm text-gray-500 mt-1">Manage signing certificates and provisioning profiles</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Certificate'}
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
          <h2 className="font-semibold text-gray-900 mb-5">Upload Certificate</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Name *</label>
                <input type="text" value={certName} onChange={(e) => setCertName(e.target.value)} required
                  placeholder="My Dev Certificate"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">P12 Password *</label>
                <input type="password" value={p12Password} onChange={(e) => setP12Password(e.target.value)} required
                  placeholder="Certificate password"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">.p12 Certificate File *</label>
                <input type="file" accept=".p12,.pfx" onChange={(e) => setP12File(e.target.files?.[0] ?? null)} required
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provisioning Profile</label>
                <input type="file" accept=".mobileprovision" onChange={(e) => setProvisionFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={uploading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
                {uploading ? 'Uploading...' : 'Upload Certificate'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Certificates ({certs.length})</h2>
        </div>
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>
        ) : certs.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            <p>No certificates uploaded yet.</p>
            <p className="mt-1 text-xs">Upload a .p12 certificate and provisioning profile to start signing apps.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {certs.map((cert) => (
              <li key={cert.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{cert.name}</p>
                    {cert.isDefault && (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Default</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {cert.teamName || 'Unknown Team'}
                    {cert.expiresAt && ` · Expires ${new Date(cert.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!cert.isDefault && (
                    <button onClick={() => handleSetDefault(cert.id)}
                      className="text-xs text-blue-600 hover:underline px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors">
                      Set Default
                    </button>
                  )}
                  <button onClick={() => handleDelete(cert.id, cert.name)}
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
