const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AppVersion {
  id: string;
  appId: string;
  version: string;
  buildNumber: string | null;
  releaseNotes: string | null;
  signingStatus: 'PENDING' | 'SIGNING' | 'SIGNED' | 'FAILED' | 'SKIPPED';
  signingError: string | null;
  signedIpaPath: string | null;
  manifestPath: string | null;
  fileSize: number | null;
  downloadCount: number;
  createdAt: string;
  certificate?: { id: string; name: string; teamName: string | null } | null;
}

export interface Certificate {
  id: string;
  name: string;
  teamName: string | null;
  teamId: string | null;
  expiresAt: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface App {
  id: string;
  name: string;
  bundleId: string;
  version: string;
  description: string;
  category: string | null;
  iconPath: string | null;
  ipaFilename: string | null;
  iconFilename: string | null;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  versions?: AppVersion[];
}

export function getIconUrl(app: App): string {
  if (app.iconPath) {
    return `${API_URL}/files/apps/${app.id}/icon`;
  }
  if (app.iconFilename) {
    return `${API_URL}/files/icons/${app.iconFilename}`;
  }
  return `${API_URL}/files/apps/${app.id}/icon`;
}

export function getManifestUrl(appId: string): string {
  return `${API_URL}/api/apps/${appId}/manifest.plist`;
}

export function getInstallLink(appId: string): string {
  const manifestUrl = getManifestUrl(appId);
  return `itms-services://?action=download-manifest&url=${encodeURIComponent(manifestUrl)}`;
}

export async function getApps(search?: string): Promise<App[]> {
  const url = new URL(`${API_URL}/api/apps`);
  if (search) url.searchParams.set('search', search);
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch apps');
  const data = await res.json();
  if (Array.isArray(data)) return data;
  return data.apps || [];
}

export async function getApp(id: string): Promise<App> {
  const res = await fetch(`${API_URL}/api/apps/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('App not found');
  return res.json();
}

export async function loginAdmin(username: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Invalid credentials');
  const data = await res.json() as { token: string };
  return data.token;
}

export async function uploadApp(formData: FormData, token: string): Promise<App> {
  const res = await fetch(`${API_URL}/api/apps`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' })) as { error: string };
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

export async function deleteApp(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/apps/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete app');
}

export async function getVersions(appId: string): Promise<AppVersion[]> {
  const res = await fetch(`${API_URL}/api/apps/${appId}/versions`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch versions');
  return res.json();
}

export async function uploadVersion(appId: string, formData: FormData, token: string): Promise<AppVersion> {
  const res = await fetch(`${API_URL}/api/apps/${appId}/versions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' })) as { error: string };
    throw new Error(err.error || 'Version upload failed');
  }
  return res.json();
}

export async function getCertificates(token: string): Promise<Certificate[]> {
  const res = await fetch(`${API_URL}/api/certificates`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch certificates');
  return res.json();
}

export async function uploadCertificate(formData: FormData, token: string): Promise<Certificate> {
  const res = await fetch(`${API_URL}/api/certificates`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' })) as { error: string };
    throw new Error(err.error || 'Certificate upload failed');
  }
  return res.json();
}

export async function deleteCertificate(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/certificates/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete certificate');
}

export async function setDefaultCertificate(id: string, token: string): Promise<Certificate> {
  const res = await fetch(`${API_URL}/api/certificates/${id}/default`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to set default certificate');
  return res.json();
}

export async function signVersion(
  appId: string,
  versionId: string,
  certificateId: string,
  token: string,
): Promise<AppVersion> {
  const res = await fetch(`${API_URL}/api/apps/${appId}/versions/${versionId}/sign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ certificateId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Signing failed' })) as { error: string };
    throw new Error(err.error || 'Signing failed');
  }
  return res.json();
}
