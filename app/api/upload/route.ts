import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    return NextResponse.json(
      {
        error:
          "PINATA_JWT is not configured. Add a Pinata JWT to upload metadata to IPFS. Local previews stay in the browser only.",
        missing: "PINATA_JWT",
      },
      { status: 501 }
    );
  }

  const pinataForm = new FormData();
  pinataForm.append("file", file, file.name);

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: pinataForm,
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: `Pinata upload failed: ${text.slice(0, 200)}` },
      { status: 502 }
    );
  }

  const payload = (await response.json()) as { IpfsHash: string };
  const cid = payload.IpfsHash;
  const gateway =
    process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs";

  return NextResponse.json({
    uri: `ipfs://${cid}`,
    gatewayUrl: `${gateway}/${cid}`,
    provider: "pinata",
  });
}
