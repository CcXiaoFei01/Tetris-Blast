(function bootstrapGamePlatformRuntime() {
  const config = window.GAME_RUNTIME_CONFIG || {};
  const ttGame = window.TTMinis?.game || null;
  const showListeners = new Set();
  let lastShowInfo = null;

  if (ttGame && typeof ttGame.onShow === "function") {
    ttGame.onShow((info) => {
      lastShowInfo = info || null;
      showListeners.forEach((listener) => {
        try {
          listener(lastShowInfo);
        } catch {
          // Ignore subscriber errors.
        }
      });
    });
  }

  function callPlatform(method, options = {}) {
    return new Promise((resolve) => {
      if (!ttGame || typeof ttGame[method] !== "function") {
        resolve({ ok: false, error: new Error(`platform api unavailable: ${method}`) });
        return;
      }

      try {
        ttGame[method]({
          ...options,
          success: (result) => resolve({ ok: true, result }),
          fail: (error) => resolve({ ok: false, error }),
        });
      } catch (error) {
        resolve({ ok: false, error });
      }
    });
  }

  function setPlatformTopInset(rect) {
    const value = rect && typeof rect.top === "number" && typeof rect.height === "number"
      ? Math.max(rect.top + rect.height + 12, 0)
      : 0;
    document.documentElement.style.setProperty("--platform-top-inset", `${value}px`);
  }

  const runtime = {
    kind: ttGame ? "tiktok" : "browser",
    isTikTok: Boolean(ttGame),
    config,
    user: null,
    async init() {
      if (!ttGame) {
        setPlatformTopInset(null);
        return { ok: true, mode: "browser" };
      }

      const clientKey = config.tiktok?.clientKey || "";
      let initResult = { ok: true };

      if (clientKey) {
        initResult = await callPlatform("init", { clientKey });
      }

      if (typeof ttGame.setLoadingProgress === "function") {
        try {
          ttGame.setLoadingProgress({ progress: 100 });
        } catch {
          try {
            ttGame.setLoadingProgress({ progress: 1 });
          } catch {
            // Ignore runtime differences between SDK versions.
          }
        }
      }

      setPlatformTopInset(this.getMenuButtonRect());
      return initResult.ok ? { ok: true, mode: "tiktok" } : initResult;
    },
    async login() {
      if (!ttGame || typeof ttGame.login !== "function") {
        this.user = { anonymous: true, platform: "browser", code: "" };
        return { ok: true, user: this.user };
      }

      const result = await callPlatform("login");
      if (!result.ok) {
        return result;
      }

      this.user = {
        anonymous: false,
        platform: "tiktok",
        code: result.result?.code || "",
        anonymousCode: result.result?.anonymousCode || "",
      };
      return { ok: true, user: this.user };
    },
    canShare() {
      return Boolean(ttGame && typeof ttGame.shareAppMessage === "function");
    },
    async share(payload) {
      if (!this.canShare()) {
        return false;
      }

      try {
        ttGame.shareAppMessage({
          title: payload.title,
          desc: payload.text,
        });
        return true;
      } catch {
        return false;
      }
    },
    async checkScene(scene) {
      if (!ttGame || typeof ttGame.checkScene !== "function") {
        return false;
      }

      return new Promise((resolve) => {
        try {
          ttGame.checkScene({
            scene,
            success: (result) => resolve(result?.isExist !== false),
            fail: () => resolve(false),
          });
        } catch {
          resolve(false);
        }
      });
    },
    async navigateToScene(scene) {
      if (!ttGame || typeof ttGame.navigateToScene !== "function") {
        return false;
      }

      return new Promise((resolve) => {
        try {
          ttGame.navigateToScene({
            scene,
            success: () => resolve(true),
            fail: () => resolve(false),
          });
        } catch {
          resolve(false);
        }
      });
    },
    onShow(listener) {
      if (typeof listener !== "function") {
        return () => {};
      }
      showListeners.add(listener);
      if (lastShowInfo) {
        listener(lastShowInfo);
      }
      return () => {
        showListeners.delete(listener);
      };
    },
    getLaunchInfo() {
      return lastShowInfo;
    },
    haptic(style = "light") {
      if (!ttGame || typeof ttGame.vibrateShort !== "function") {
        return;
      }

      try {
        ttGame.vibrateShort({
          type: style === "warning" ? "heavy" : "light",
        });
      } catch {
        // Ignore unsupported devices or SDK differences.
      }
    },
    getMenuButtonRect() {
      if (!ttGame || typeof ttGame.getMenuButtonBoundingClientRect !== "function") {
        return null;
      }

      try {
        return ttGame.getMenuButtonBoundingClientRect() || null;
      } catch {
        return null;
      }
    },
    readStorage(key) {
      if (!ttGame || typeof ttGame.getStorageSync !== "function") {
        return null;
      }

      try {
        const value = ttGame.getStorageSync(key);
        return value === undefined ? null : value;
      } catch {
        return null;
      }
    },
    writeStorage(key, value) {
      if (!ttGame || typeof ttGame.setStorageSync !== "function") {
        return false;
      }

      try {
        ttGame.setStorageSync(key, value);
        return true;
      } catch {
        return false;
      }
    },
    removeStorage(key) {
      if (!ttGame || typeof ttGame.removeStorageSync !== "function") {
        return false;
      }

      try {
        ttGame.removeStorageSync(key);
        return true;
      } catch {
        return false;
      }
    },
  };

  window.GamePlatformRuntime = runtime;
})();
