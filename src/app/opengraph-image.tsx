import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Proof18";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 56px",
          background:
            "linear-gradient(135deg, #0a0908 0%, #17120d 50%, #0b0908 100%)",
          color: "#f8edcc",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "linear-gradient(135deg, #f3d58b 0%, #b18439 100%)",
              color: "#090807",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              fontWeight: 700,
            }}
          >
            P
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div
              style={{
                fontSize: 22,
                letterSpacing: 5,
                textTransform: "uppercase",
                color: "#d9bf80",
                fontFamily: "Arial",
              }}
            >
              PL Genesis Submission
            </div>
            <div style={{ fontSize: 68, fontWeight: 700 }}>Proof18</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 60, lineHeight: 1.02 }}>
            Private policy. Controlled autonomy. Guardian-delegated AI execution.
          </div>
          <div
            style={{
              display: "flex",
              gap: 18,
              fontFamily: "Arial",
              fontSize: 22,
              color: "#cbb997",
            }}
          >
            <div>Flow Testnet = execution</div>
            <div>•</div>
            <div>Zama on Sepolia = confidential policy</div>
            <div>•</div>
            <div>Vincent / Lit = bounded authority</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
