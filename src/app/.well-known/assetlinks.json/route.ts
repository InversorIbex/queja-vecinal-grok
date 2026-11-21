const PACKAGE_NAME = "es.quejasvecinales.app";

export function GET() {
  const fingerprints = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const body =
    fingerprints.length === 0
      ? []
      : [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: PACKAGE_NAME,
              sha256_cert_fingerprints: fingerprints,
            },
          },
        ];

  return Response.json(body, {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
  });
}
