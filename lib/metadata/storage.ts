export type StoredAsset = {
  uri: string;
  gatewayUrl: string;
  provider: "pinata" | "local";
};

export async function uploadFile(file: File): Promise<StoredAsset> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/upload", { method: "POST", body });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || "Upload failed.");
  }
  return (await response.json()) as StoredAsset;
}

export async function uploadJson(data: unknown): Promise<StoredAsset> {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const file = new File([blob], "metadata.json", { type: "application/json" });
  return uploadFile(file);
}
