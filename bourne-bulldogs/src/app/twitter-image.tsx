import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { club } from "@/content/site";

export const runtime = "nodejs";
export const alt = `${club.name}: youth basketball in Bourne, Lincolnshire`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const [logo, anton] = await Promise.all([
    readFile(path.join(process.cwd(), "public/images/logo-on-dark.png")),
    readFile(path.join(process.cwd(), "node_modules/@fontsource/anton/files/anton-latin-400-normal.woff")),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0e0d0f", color: "#f2ece1", position: "relative", fontFamily: "Anton" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 18, background: "#e8673c", display: "flex" }} />
        <div
          style={{
            position: "absolute",
            right: -220,
            top: -160,
            width: 760,
            height: 760,
            borderRadius: 9999,
            border: "3px solid rgba(232,103,60,.35)",
            display: "flex",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", padding: "0 72px", gap: 56, width: "100%" }}>
          <img src={logoSrc} width={380} height={380} alt="" />
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", fontSize: 30, letterSpacing: 4, color: "#e8673c", textTransform: "uppercase" }}>Welcome ballers</div>
            <div style={{ display: "flex", flexDirection: "column", fontSize: 104, lineHeight: 0.92, textTransform: "uppercase", marginTop: 12 }}>
              <span>Bourne Bulldogs</span>
              <span style={{ fontSize: 58, color: "#ad9272" }}>Basketball Club</span>
            </div>
            <div style={{ display: "flex", fontSize: 34, marginTop: 28, color: "#f2ece1", textTransform: "uppercase", letterSpacing: 1 }}>
              Youth basketball in Bourne, Lincolnshire
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Anton", data: anton, style: "normal", weight: 400 }] }
  );
}
