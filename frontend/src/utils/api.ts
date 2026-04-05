const API_BASE = import.meta.env.VITE_API_URL || '';

async function handleResponse(res: Response) {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("text/html")) {
    // In dev mode, Vite serves index.html for unmatched API routes.
    // We treat this as a 404 so SlugPage drops into Create mode.
    const error: any = new Error("API returned HTML fallback");
    error.status = 404;
    throw error;
  }

  if (!res.ok) {
    const error: any = new Error(`API error: ${res.status}`);
    error.status = res.status;
    try { error.body = await res.json(); } catch { }
    throw error;
  }
  return res.json();
}

export async function checkSlug(slug: string): Promise<{ available: boolean }> {
  const res = await fetch(`${API_BASE}/api/slug-check/${slug}`);
  return handleResponse(res);
}

export async function getClip(slug: string) {
  const res = await fetch(`${API_BASE}/api/clip/${slug}`);
  return handleResponse(res);
}

export async function unlockClip(slug: string, passwordHash: string | null = null) {
  const res = await fetch(`${API_BASE}/api/clip/${slug}/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(passwordHash ? { passwordHash } : {}),
  });
  return handleResponse(res);
}

export async function createClip(payload: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/api/clip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getPresignedUploadUrl(
  slug: string,
  file: File,
  fileIndex: number
): Promise<{ uploadUrl: string; s3Key: string }> {
  const params = new URLSearchParams({
    slug,
    filename: file.name,
    filetype: file.type || "application/octet-stream",
    filesize: String(file.size),
    fileindex: String(fileIndex),
  });
  const res = await fetch(`${API_BASE}/api/presign?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to get upload URL");
  }
  return res.json();
}

/**
 * Fetches a short-lived (5 min) presigned S3 GET URL for a private S3 object.
 * Use this instead of building direct https://bucket.s3.amazonaws.com/... URLs.
 */
export async function getSignedDownloadUrl(s3Key: string): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE}/api/download?s3Key=${encodeURIComponent(s3Key)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Failed to get download URL');
  }
  return res.json();
}

/** Extends a clip's expiry by additionalSeconds (max 50 days from now). */
export async function extendClip(slug: string, additionalSeconds: number): Promise<{ newExpiresAt: string; cappedAt50Days: boolean }> {
  const res = await fetch(`${API_BASE}/api/extend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, additionalSeconds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Failed to extend clip');
  }
  return res.json();
}

export function uploadFileToS3(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status === 200) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Upload network error"));
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
}
