const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface App {
  id: string;
  name: string;
  bundleId: string;
  version: string;
  description: string;
  category: string | null;
  ipaFilename: string;
  iconFilename: string;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export function getIconUrl(iconFilename: string): string {
  return `${API_URL}/files/icons/${iconFilename}`;
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
  return res.json();
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
