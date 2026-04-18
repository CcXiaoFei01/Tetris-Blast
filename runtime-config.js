(() => {
  const defaults = {
    platform: "browser",
    tiktok: {
      // Fill these before packaging for a real TikTok Mini Game build.
      appId: "",
      clientKey: "",
      orientation: "portrait",
      enableMockLogin: true,
    },
  };

  const existing = window.GAME_RUNTIME_CONFIG || {};

  window.GAME_RUNTIME_CONFIG = {
    ...defaults,
    ...existing,
    tiktok: {
      ...defaults.tiktok,
      ...(existing.tiktok || {}),
    },
  };
})();
