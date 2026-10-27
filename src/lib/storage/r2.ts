import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Cloudflare R2 via its S3-compatible API. Everything is read from env at call
// time and degrades gracefully when unset, so the public site never depends on
// R2 being configured — only uploads do. Setup: docs/service-setup.md.

function config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

/** True when uploads can work (credentials + bucket + public URL all set). */
export function isStorageConfigured() {
  return config() !== null && Boolean(process.env.R2_PUBLIC_BASE_URL);
}

let cachedClient: S3Client | undefined;
function client(cfg: NonNullable<ReturnType<typeof config>>) {
  cachedClient ??= new S3Client({
    region: "auto",
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  });
  return cachedClient;
}

/** Public URL for an object key, or null if no public base URL is configured. */
export function publicUrl(key: string): string | null {
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  return base ? `${base}/${key}` : null;
}

export async function putObject(key: string, body: Uint8Array, contentType: string) {
  const cfg = config();
  if (!cfg) {
    throw new Error("Photo storage isn't configured yet (missing R2_* environment variables).");
  }
  await client(cfg).send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Keys are unique per upload and never rewritten, so cache forever.
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function deleteObject(key: string) {
  const cfg = config();
  if (!cfg) return;
  await client(cfg).send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
}
