"use client";

import * as React from "react";

/**
 * Where a slide image is fetched from. In the app the default route checks the session's
 * org; the audience view (and the PDF export, which renders it) switches to the token route,
 * which only serves images the deck references.
 */
const AssetUrlContext = React.createContext<(assetId: string) => string>(
  (assetId) => `/api/assets/${assetId}`
);

export function AudienceAssetUrlProvider({
  presentToken,
  children,
}: {
  presentToken: string;
  children: React.ReactNode;
}) {
  const resolve = React.useCallback(
    (assetId: string) => `/p/${encodeURIComponent(presentToken)}/assets/${assetId}`,
    [presentToken]
  );
  return <AssetUrlContext.Provider value={resolve}>{children}</AssetUrlContext.Provider>;
}

export function useAssetUrl(): (assetId: string) => string {
  return React.useContext(AssetUrlContext);
}
