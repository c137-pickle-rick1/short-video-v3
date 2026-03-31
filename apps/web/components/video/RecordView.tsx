"use client";

import { useEffect } from "react";

export default function RecordView({ videoId }: { videoId: string }) {
  useEffect(() => {
    fetch(`/api/videos/${videoId}/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {});
  }, [videoId]);

  return null;
}
