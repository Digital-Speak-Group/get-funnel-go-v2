"use client";

import * as React from "react";

interface ChannelContent {
  headline: string;
  channel: "whatsapp" | "email" | "sms" | "phone" | "dm";
  scripts: Array<{
    moment: string;
    message: string;
  }>;
}

const channelIcons: Record<ChannelContent["channel"], string> = {
  whatsapp: "💬",
  email: "📧",
  sms: "💬",
  phone: "📞",
  dm: "✉️",
};

const channelColors: Record<ChannelContent["channel"], string> = {
  whatsapp: "#25D366",
  email: "#EA4335",
  sms: "#34B7F1",
  phone: "#4285F4",
  dm: "#8B5CF6",
};

export function ChannelSlide({ content, theme }: { content: ChannelContent; theme: Record<string, string> }) {
  const { headline, channel, scripts } = content;
  const icon = channelIcons[channel];
  const channelColor = channelColors[channel];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "96px",
        fontFamily: theme["--slide-font-body"],
        color: theme["--slide-text"],
      }}
    >
      <header style={{ marginBottom: "48px", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 20px",
            background: `${channelColor}1a`,
            borderRadius: "9999px",
            marginBottom: "24px",
            fontSize: "14px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: channelColor,
          }}
        >
          <span style={{ fontSize: "20px" }}>{icon}</span>
          {channel.toUpperCase()}
        </div>
        <h1
          style={{
            fontSize: "48px",
            lineHeight: 1.15,
            fontWeight: 700,
            fontFamily: theme["--slide-font-display"],
            marginBottom: "16px",
            color: theme["--slide-text"],
          }}
        >
          {headline}
        </h1>
      </header>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {scripts.map((script, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              gap: "20px",
              padding: "28px",
              background: theme["--slide-surface"],
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${channelColor}33`,
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: "80px",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "28px",
                }}
              >
                {icon}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: channelColor,
                }}
              >
                {script.moment}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "18px",
                  lineHeight: 1.55,
                  color: theme["--slide-text"],
                  padding: "16px",
                  background: theme["--slide-bg"],
                  borderRadius: theme["--slide-radius"],
                  border: `1px solid ${theme["--slide-muted"]}1a`,
                  fontFamily: theme["--slide-font-mono"],
                  whiteSpace: "pre-wrap",
                }}
              >
                {script.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}