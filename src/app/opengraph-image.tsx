import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "GetFunnels - Générez des decks de vente en minutes";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b", // zinc-950
          backgroundImage: "radial-gradient(circle at center, #2e1065 0%, #09090b 70%)", // violet-950 glow
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "24px",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                display: "flex",
                height: "80px",
                width: "80px",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "16px",
                backgroundColor: "#7c3aed", // violet-600
                color: "white",
                fontSize: "48px",
                fontWeight: 900,
              }}
            >
              G
            </div>
            <span
              style={{
                fontSize: "64px",
                fontWeight: 900,
                color: "white",
                letterSpacing: "-0.05em",
              }}
            >
              GetFunnels
            </span>
          </div>

          <h1
            style={{
              fontSize: "72px",
              fontWeight: 900,
              color: "white",
              textAlign: "center",
              lineHeight: 1.1,
              letterSpacing: "-0.05em",
              maxWidth: "900px",
              marginBottom: "32px",
            }}
          >
            De votre script à un deck de vente
            <br />
            <span style={{ color: "#a78bfa" /* violet-400 */ }}>en quelques secondes.</span>
          </h1>

          <p
            style={{
              fontSize: "32px",
              color: "#a1a1aa", // zinc-400
              textAlign: "center",
              maxWidth: "800px",
            }}
          >
            Généré par IA, conçu pour la conversion.
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
