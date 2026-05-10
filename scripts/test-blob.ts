import { put, del } from "@vercel/blob";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

async function main() {
  console.log("Testing Vercel Blob (BLOB_READ_WRITE_TOKEN)...\n");

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    console.error("Missing BLOB_READ_WRITE_TOKEN.");
    console.error("Add it to .env.local (see .env.example). On Vercel: Project → Settings → Environment Variables.\n");
    process.exit(1);
  }

  const key = `ci-wire-test/${Date.now()}.txt`;
  const body = Buffer.from(`ok ${new Date().toISOString()}\n`, "utf8");

  try {
    const blob = await put(key, body, {
      access: "public",
      contentType: "text/plain; charset=utf-8",
    });
    console.log("Upload OK:", blob.url);
    await del(blob.url);
    console.log("Delete OK.\nBlob token is valid for this store.\n");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Blob test failed:", msg);
    process.exit(1);
  }
}

main();
