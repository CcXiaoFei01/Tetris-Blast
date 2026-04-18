const BOARD_SIZE = 10;
const DRAG_THRESHOLD = 8;
const TOTAL_LEVELS = 20;
const SESSION_VERSION = 4;
const ENABLE_TOUCH_FALLBACK = typeof window !== "undefined" && !("PointerEvent" in window) && "ontouchstart" in window;
const STORAGE_KEYS = { profile: "wood-block.profile.v1", session: "wood-block.session.v1" };
const DEFAULT_PROFILE = {
  bestScore: 0,
  endlessBestScore: 0,
  gamesPlayed: 0,
  totalPlayMs: 0,
  unlockedLevel: 1,
  sidebarRewardClaimedDate: "",
  pendingSidebarHammer: 0,
  pendingSidebarUndo: 0,
};
const SHAPES = [
  { id: "i-flat", family: "I", width: 4, height: 1, colorKey: "cyan", cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  { id: "i-tall", family: "I", width: 1, height: 4, colorKey: "cyan", cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
  { id: "o", family: "O", width: 2, height: 2, colorKey: "yellow", cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  { id: "t-up", family: "T", width: 3, height: 2, colorKey: "purple", cells: [[0, 1], [1, 0], [1, 1], [1, 2]] },
  { id: "t-right", family: "T", width: 2, height: 3, colorKey: "purple", cells: [[0, 0], [1, 0], [1, 1], [2, 0]] },
  { id: "t-down", family: "T", width: 3, height: 2, colorKey: "purple", cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
  { id: "t-left", family: "T", width: 2, height: 3, colorKey: "purple", cells: [[0, 1], [1, 0], [1, 1], [2, 1]] },
  { id: "s-flat", family: "S", width: 3, height: 2, colorKey: "green", cells: [[0, 1], [0, 2], [1, 0], [1, 1]] },
  { id: "s-tall", family: "S", width: 2, height: 3, colorKey: "green", cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  { id: "z-flat", family: "Z", width: 3, height: 2, colorKey: "red", cells: [[0, 0], [0, 1], [1, 1], [1, 2]] },
  { id: "z-tall", family: "Z", width: 2, height: 3, colorKey: "red", cells: [[0, 1], [1, 0], [1, 1], [2, 0]] },
  { id: "j-up", family: "J", width: 3, height: 2, colorKey: "blue", cells: [[0, 0], [1, 0], [1, 1], [1, 2]] },
  { id: "j-right", family: "J", width: 2, height: 3, colorKey: "blue", cells: [[0, 0], [0, 1], [1, 0], [2, 0]] },
  { id: "j-down", family: "J", width: 3, height: 2, colorKey: "blue", cells: [[0, 0], [0, 1], [0, 2], [1, 2]] },
  { id: "j-left", family: "J", width: 2, height: 3, colorKey: "blue", cells: [[0, 1], [1, 1], [2, 0], [2, 1]] },
  { id: "l-up", family: "L", width: 3, height: 2, colorKey: "orange", cells: [[0, 2], [1, 0], [1, 1], [1, 2]] },
  { id: "l-right", family: "L", width: 2, height: 3, colorKey: "orange", cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
  { id: "l-down", family: "L", width: 3, height: 2, colorKey: "orange", cells: [[0, 0], [0, 1], [0, 2], [1, 0]] },
  { id: "l-left", family: "L", width: 2, height: 3, colorKey: "orange", cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  { id: "mini-single", family: "Mini", width: 1, height: 1, colorKey: "yellow", cells: [[0, 0]] },
  { id: "mini-domino-flat", family: "Mini", width: 2, height: 1, colorKey: "green", cells: [[0, 0], [0, 1]] },
  { id: "mini-domino-tall", family: "Mini", width: 1, height: 2, colorKey: "green", cells: [[0, 0], [1, 0]] },
];
const SHAPE_MAP = Object.fromEntries(SHAPES.map((shape) => [shape.id, shape]));
const SPECIAL_SHAPE_IDS = new Set(["mini-single", "mini-domino-flat", "mini-domino-tall"]);
const STANDARD_SHAPES = SHAPES.filter((shape) => !SPECIAL_SHAPE_IDS.has(shape.id));
const SPECIAL_SHAPES = SHAPES.filter((shape) => SPECIAL_SHAPE_IDS.has(shape.id));
const PIECE_ROLL_PROFILES = {
  normal: { standard: 1, single: 0.4, domino: 0.7 },
  warning: { standard: 0.9, single: 1.7, domino: 2.3 },
  critical: { standard: 0.5, single: 3.2, domino: 4.4 },
  emergency: { standard: 0.12, single: 4.8, domino: 6.2 },
};
const SCORE_TABLE = { 0: 0, 1: 100, 2: 300, 3: 600 };
const ENDLESS_STAGE_CONFIGS = [
  {
    minScore: 0,
    spawnInterval: 450,
    targetCellsRange: [3, 4],
    durabilityRange: [3, 4],
    allowedShapes: ["single", "domino"],
    maxHp: 2,
    minGroups: 2,
    maxGroups: 3,
    maxLargeGroups: 0,
    maxHighHpGroups: 0,
    easyGroupTarget: 2,
    maxCenterCells: 1,
  },
  {
    minScore: 1000,
    spawnInterval: 400,
    targetCellsRange: [4, 6],
    durabilityRange: [4, 7],
    allowedShapes: ["single", "domino", "triLine", "triL"],
    maxHp: 3,
    minGroups: 2,
    maxGroups: 3,
    maxLargeGroups: 0,
    maxHighHpGroups: 0,
    easyGroupTarget: 2,
    maxCenterCells: 2,
  },
  {
    minScore: 3000,
    spawnInterval: 350,
    targetCellsRange: [5, 7],
    durabilityRange: [7, 10],
    allowedShapes: ["domino", "triLine", "triL", "square", "line4"],
    maxHp: 4,
    minGroups: 2,
    maxGroups: 4,
    maxLargeGroups: 1,
    maxHighHpGroups: 1,
    easyGroupTarget: 2,
    maxCenterCells: 3,
  },
  {
    minScore: 6000,
    spawnInterval: 320,
    targetCellsRange: [6, 8],
    durabilityRange: [10, 14],
    allowedShapes: ["domino", "triLine", "triL", "square", "line4", "l4", "t4"],
    maxHp: 5,
    minGroups: 3,
    maxGroups: 4,
    maxLargeGroups: 1,
    maxHighHpGroups: 1,
    easyGroupTarget: 2,
    maxCenterCells: 4,
  },
  {
    minScore: 10000,
    spawnInterval: 300,
    targetCellsRange: [7, 9],
    durabilityRange: [13, 18],
    allowedShapes: ["domino", "triLine", "triL", "square", "line4", "l4", "t4", "ring"],
    maxHp: 6,
    minGroups: 3,
    maxGroups: 4,
    maxLargeGroups: 2,
    maxHighHpGroups: 2,
    easyGroupTarget: 2,
    maxCenterCells: 5,
  },
];
const ENDLESS_INITIAL_CONFIG = {
  targetCells: 3,
  durabilityBudget: 3,
  allowedShapes: ["single"],
  maxHp: 1,
  minGroups: 3,
  maxGroups: 3,
  maxLargeGroups: 0,
  maxHighHpGroups: 0,
  easyGroupTarget: 2,
  maxCenterCells: 1,
};
const ENDLESS_HAMMER_REWARD_SCORE = 1800;
const ENDLESS_UNDO_REWARD_SCORE = 2600;

const boardEl = document.getElementById("board");
const appShellEl = document.querySelector(".app-shell");
const gameScreenEl = document.getElementById("gameScreen");
const startScreenEl = document.getElementById("startScreen");
const topBarEl = document.querySelector(".top-bar");
const statusStripEl = document.querySelector(".status-strip");
const trayPanelEl = document.querySelector(".tray-panel");
const pauseButton = document.getElementById("pauseButton");
const undoButton = document.getElementById("undoButton");
const hammerButton = document.getElementById("hammerButton");
const startButton = document.getElementById("startButton");
const endlessButton = document.getElementById("endlessButton");
const continueButton = document.getElementById("continueButton");
const resumeButton = document.getElementById("resumeButton");
const homeButton = document.getElementById("homeButton");
const restartButton = document.getElementById("restartButton");
const gameOverHomeButton = document.getElementById("gameOverHomeButton");
const shareButton = document.getElementById("shareButton");
const sidebarEntryButton = document.getElementById("sidebarEntryButton");
const sidebarEntryLabelEl = document.getElementById("sidebarEntryLabel");
const trayEls = Array.from(document.querySelectorAll(".tray-slot"));
const dragGhostEl = document.getElementById("dragGhost");
const boardPanelEl = boardEl?.closest(".board-panel") || null;
const effectLayerEl = createEffectLayer();
const scoreValueEl = document.getElementById("scoreValue");
const bestScoreValueEl = document.getElementById("bestScoreValue");
const comboBadgeEl = document.getElementById("comboBadge");
const timeValueEl = document.getElementById("timeValue");
const phaseValueEl = document.getElementById("phaseValue");
const targetValueEl = document.getElementById("targetValue");
const rowsClearedValueEl = document.getElementById("rowsClearedValue");
const colsClearedValueEl = document.getElementById("colsClearedValue");
const maxComboValueEl = document.getElementById("maxComboValue");
const undoCountValueEl = document.getElementById("undoCountValue");
const hammerCountValueEl = document.getElementById("hammerCountValue");
const boardMessageEl = document.getElementById("boardMessage");
const pauseOverlayEl = document.getElementById("pauseOverlay");
const levelCompleteOverlayEl = document.getElementById("levelCompleteOverlay");
const gameOverOverlayEl = document.getElementById("gameOverOverlay");
const finalScoreValueEl = document.getElementById("finalScoreValue");
const finalBestValueEl = document.getElementById("finalBestValue");
const finalRowsValueEl = document.getElementById("finalRowsValue");
const finalColsValueEl = document.getElementById("finalColsValue");
const finalComboValueEl = document.getElementById("finalComboValue");
const homeBestValueEl = document.getElementById("homeBestValue");
const homeGamesValueEl = document.getElementById("homeGamesValue");
const homeUnlockedLevelValueEl = document.getElementById("homeUnlockedLevelValue");
const endlessBestValueEl = document.getElementById("endlessBestValue");
const continueHintEl = document.getElementById("continueHint");
const runtimeStatusEl = document.getElementById("runtimeStatus");
const nextLevelButton = document.getElementById("nextLevelButton");
const levelHomeButton = document.getElementById("levelHomeButton");
const levelCompleteTitleEl = document.getElementById("levelCompleteTitle");
const levelCompleteCopyEl = document.getElementById("levelCompleteCopy");
const sidebarRewardOverlayEl = document.getElementById("sidebarRewardOverlay");
const sidebarRewardTitleEl = document.getElementById("sidebarRewardTitle");
const sidebarRewardCopyEl = document.getElementById("sidebarRewardCopy");
const sidebarRewardActionButton = document.getElementById("sidebarRewardActionButton");
const sidebarRewardCloseButton = document.getElementById("sidebarRewardCloseButton");
const resultEyebrowEl = gameOverOverlayEl.querySelector(".eyebrow");
const resultTitleEl = gameOverOverlayEl.querySelector("h2");

const gameRuntime = window.GamePlatformRuntime || createNoopGameRuntime();
const runtimeState = {
  initialized: false,
  loginAttempted: false,
  loginSucceeded: false,
  lastError: "",
  storageHydrated: false,
};
const platformBridge = createPlatformBridge();
let profile = { ...DEFAULT_PROFILE };
let pieceIdSeed = 0;
let uiAnimationFrame = 0;
let clearResolveTimer = 0;
let scoreTween = null;
let noticeTimer = 0;
let audioContext = null;
let audioMasterGain = null;
let lastPickupSoundAt = 0;
let activeTouchId = null;
let responsiveLayoutFrame = 0;

const state = {
  mode: "level",
  board: createEmptyBoard(),
  slots: [null, null, null],
  selectedSlot: null,
  pendingDrag: null,
  dragging: null,
  suppressBoardClick: false,
  hammerMode: false,
  score: 0,
  displayedScore: 0,
  currentLevel: 1,
  targetsTotal: 0,
  targetsRemaining: 0,
  totalRowsCleared: 0,
  totalColsCleared: 0,
  comboStreak: 0,
  maxCombo: 0,
  undoCount: 1,
  hammerCount: 1,
  placementsCount: 0,
  undoSnapshot: null,
  preview: null,
  clearMarks: null,
  isResolving: false,
  status: "home",
  sessionStartedAt: 0,
  totalPausedMs: 0,
  pauseStartedAt: 0,
  elapsedAtPause: 0,
  elapsedAtGameOver: 0,
  pendingNextLevel: null,
  endlessWave: 0,
  endlessNextSpawnScore: 0,
  endlessNextHammerScore: 0,
  endlessNextUndoScore: 0,
  endReason: null,
  notice: "",
  sidebarSupported: false,
  sidebarRewardEligible: false,
  sidebarRewardSceneChecked: false,
};

buildBoard();
setupSidebarRewardMonitor();
bindEvents();
syncRuntimeInfo();
render();
startUiLoop();
void initializeRuntime();

window.WoodBlockGame = {
  exportSession: () => createSessionPayload(),
  startNewGame: () => startGame(1),
  startEndlessGame: () => startEndlessGame(),
  resumeSavedGame: () => continueFromHome(),
};

function createNoopGameRuntime() {
  return {
    kind: "browser",
    isTikTok: false,
    user: null,
    async init() {
      return { ok: true, mode: "browser" };
    },
    async login() {
      this.user = { anonymous: true, platform: "browser", code: "" };
      return { ok: true, user: this.user };
    },
    canShare() {
      return false;
    },
    async checkScene() {
      return false;
    },
    async navigateToScene() {
      return false;
    },
    onShow() {
      return () => {};
    },
    getLaunchInfo() {
      return null;
    },
    async share() {
      return false;
    },
    haptic() {},
    getMenuButtonRect() {
      return null;
    },
    readStorage(key) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    writeStorage(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
    removeStorage(key) {
      try {
        window.localStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
  };
}

async function initializeRuntime() {
  const result = await gameRuntime.init();
  runtimeState.initialized = result?.ok !== false;
  runtimeState.lastError = result?.ok === false ? String(result.error?.message || result.error || "init failed") : "";
  hydratePersistentState();
  syncRuntimeInfo();
  void refreshSidebarCapability();
}

async function ensurePlatformLogin() {
  if (!runtimeState.initialized) {
    await initializeRuntime();
  }

  if (runtimeState.loginAttempted) {
    return runtimeState.loginSucceeded;
  }

  runtimeState.loginAttempted = true;
  const result = await gameRuntime.login();
  runtimeState.loginSucceeded = result?.ok !== false;
  runtimeState.lastError = result?.ok === false ? String(result.error?.message || result.error || "login failed") : "";
  syncRuntimeInfo();
  return runtimeState.loginSucceeded;
}

function createPlatformBridge() {
  return {
    canShare() {
      return typeof gameRuntime.canShare === "function" ? gameRuntime.canShare() : false;
    },
    async checkScene(scene) {
      return typeof gameRuntime.checkScene === "function" ? gameRuntime.checkScene(scene) : false;
    },
    async navigateToScene(scene) {
      return typeof gameRuntime.navigateToScene === "function" ? gameRuntime.navigateToScene(scene) : false;
    },
    onShow(listener) {
      return typeof gameRuntime.onShow === "function" ? gameRuntime.onShow(listener) : () => {};
    },
    getLaunchInfo() {
      return typeof gameRuntime.getLaunchInfo === "function" ? gameRuntime.getLaunchInfo() : null;
    },
    async share(payload) {
      return gameRuntime.share(payload);
    },
    haptic(style = "light") {
      gameRuntime.haptic(style);
    },
  };
}

function getTodayRewardKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSidebarRewardClaimedToday() {
  return (profile.sidebarRewardClaimedDate || "") === getTodayRewardKey();
}

function isSidebarReturnLaunch(info) {
  if (!info || typeof info !== "object") {
    return false;
  }
  const scene = String(info.scene || "");
  const launchFrom = String(info.launch_from || info.launchFrom || "");
  const location = String(info.location || "");
  return scene === "021036" && launchFrom === "homepage" && (location === "sidebar_card" || location === "homepage_expand");
}

async function refreshSidebarCapability() {
  const supported = await platformBridge.checkScene("sidebar");
  state.sidebarSupported = Boolean(supported);
  state.sidebarRewardSceneChecked = true;
  if (state.sidebarSupported && state.sidebarRewardEligible) {
    openSidebarRewardOverlay();
  }
  renderSidebarEntry();
}

function setupSidebarRewardMonitor() {
  const handleShowInfo = (info) => {
    if (isSidebarReturnLaunch(info) && !isSidebarRewardClaimedToday()) {
      state.sidebarRewardEligible = true;
      renderSidebarEntry();
      openSidebarRewardOverlay();
      if (state.status === "playing" || state.status === "paused" || state.status === "levelcomplete") {
        showNotice("已从侧边栏返回，可领取今日奖励。", 2200);
      }
    }
  };

  platformBridge.onShow(handleShowInfo);
  handleShowInfo(platformBridge.getLaunchInfo());
}

function consumePendingSidebarRewards() {
  const hammer = profile.pendingSidebarHammer || 0;
  const undo = profile.pendingSidebarUndo || 0;
  if (!hammer && !undo) {
    return null;
  }
  state.hammerCount += hammer;
  state.undoCount += undo;
  profile = {
    ...profile,
    pendingSidebarHammer: 0,
    pendingSidebarUndo: 0,
  };
  saveProfile(profile);
  renderProfile();
  return { hammer, undo };
}

function renderSidebarEntry() {
  if (!sidebarEntryButton) {
    return;
  }
  sidebarEntryButton.hidden = true;
  sidebarEntryButton.classList.remove("claimable");
}

function openSidebarRewardOverlay() {
  if (!state.sidebarSupported || !sidebarRewardOverlayEl) {
    return;
  }
  sidebarRewardOverlayEl.classList.remove("active");
}

function closeSidebarRewardOverlay() {
  if (!sidebarRewardOverlayEl) {
    return;
  }
  sidebarRewardOverlayEl.classList.remove("active");
}

async function handleSidebarRewardAction() {
  const claimable = state.sidebarRewardEligible && !isSidebarRewardClaimedToday();
  if (claimable) {
    claimSidebarReward();
    return;
  }
  const opened = await platformBridge.navigateToScene("sidebar");
  if (!opened) {
    showNotice("当前环境暂不支持侧边栏入口。", 2200);
    closeSidebarRewardOverlay();
    return;
  }
  closeSidebarRewardOverlay();
}

function claimSidebarReward() {
  if (isSidebarRewardClaimedToday()) {
    state.sidebarRewardEligible = false;
    renderSidebarEntry();
    closeSidebarRewardOverlay();
    return;
  }

  profile = {
    ...profile,
    sidebarRewardClaimedDate: getTodayRewardKey(),
  };

  const activeSession = ["playing", "paused", "levelcomplete"].includes(state.status);
  if (activeSession) {
    state.hammerCount += 1;
    state.undoCount += 1;
    persistSession();
    render();
    showNotice("侧边栏奖励：锤子 +1，撤销 +1。", 2200);
  } else {
    profile = {
      ...profile,
      pendingSidebarHammer: (profile.pendingSidebarHammer || 0) + 1,
      pendingSidebarUndo: (profile.pendingSidebarUndo || 0) + 1,
    };
    showNotice("侧边栏奖励已存入，下次开局自动生效。", 2200);
  }

  saveProfile(profile);
  renderProfile();
  state.sidebarRewardEligible = false;
  renderSidebarEntry();
  closeSidebarRewardOverlay();
}

function createEffectLayer() {
  const layer = document.createElement("div");
  layer.className = "effect-layer";
  if (boardPanelEl) {
    boardPanelEl.appendChild(layer);
  }
  return layer;
}

function getAudioContext() {
  if (audioContext) {
    return audioContext;
  }
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return null;
  }
  audioContext = new AudioContextCtor();
  audioMasterGain = audioContext.createGain();
  audioMasterGain.gain.value = 0.68;
  audioMasterGain.connect(audioContext.destination);
  return audioContext;
}

function primeAudio() {
  const context = getAudioContext();
  if (context?.state === "suspended") {
    void context.resume().catch(() => {});
  }
}

function scheduleTone({ frequency, duration = 0.1, volume = 0.05, type = "triangle", startOffset = 0, glideTo = null }) {
  const context = getAudioContext();
  if (!context || !audioMasterGain) {
    return;
  }

  const startTime = context.currentTime + startOffset;
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(40, frequency), startTime);
  if (glideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, glideTo), startTime + duration);
  }

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(volume, startTime + Math.min(0.02, duration * 0.35));
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioMasterGain);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.03);
}

function getPieceCellCount(piece) {
  return SHAPE_MAP[piece?.shapeId]?.cells.length || 1;
}

function playPickupSound(piece) {
  primeAudio();
  const now = performance.now();
  if (now - lastPickupSoundAt < 70) {
    return;
  }
  lastPickupSoundAt = now;
  const cellCount = getPieceCellCount(piece);
  const base = 245 + cellCount * 14;
  scheduleTone({ frequency: base, glideTo: base * 1.08, duration: 0.04, volume: 0.022, type: "square" });
  scheduleTone({ frequency: base * 1.52, duration: 0.05, volume: 0.013, type: "triangle", startOffset: 0.01 });
}

function playDragSound(piece) {
  primeAudio();
  const base = 360 + getPieceCellCount(piece) * 26;
  scheduleTone({ frequency: base, glideTo: base * 1.22, duration: 0.055, volume: 0.028, type: "triangle" });
  scheduleTone({ frequency: base * 1.9, duration: 0.04, volume: 0.015, type: "sine", startOffset: 0.012 });
}

function playPlacementSound(piece) {
  primeAudio();
  const cellCount = getPieceCellCount(piece);
  const base = 132 + cellCount * 11;
  scheduleTone({ frequency: base, glideTo: base * 0.74, duration: 0.1, volume: 0.054, type: "square" });
  scheduleTone({ frequency: base * 1.48, glideTo: base * 1.1, duration: 0.075, volume: 0.018, type: "triangle", startOffset: 0.008 });
  scheduleTone({ frequency: base * 0.82, duration: 0.12, volume: 0.012, type: "sine", startOffset: 0.018 });
}

function playClearSound(lineCount, comboStreak) {
  primeAudio();
  const base = 420 + Math.min(5, lineCount) * 46;
  scheduleTone({ frequency: base, glideTo: base * 1.18, duration: 0.09, volume: 0.03, type: "sine" });
  scheduleTone({ frequency: base * 1.26, glideTo: base * 1.5, duration: 0.11, volume: 0.036, type: "triangle", startOffset: 0.04 });
  scheduleTone({ frequency: base * 1.58, glideTo: base * 1.96, duration: 0.13, volume: 0.03, type: "sine", startOffset: 0.082 });
  scheduleTone({ frequency: base * 1.92, duration: 0.15, volume: 0.018, type: "triangle", startOffset: 0.122 });
  if (comboStreak > 1) {
    scheduleTone({ frequency: base * 2.28, glideTo: base * 2.7, duration: 0.19, volume: 0.022, type: "sine", startOffset: 0.155 });
  }
}

function triggerBoardImpact(className, duration = 320) {
  boardEl.classList.remove(className);
  void boardEl.offsetWidth;
  boardEl.classList.add(className);
  window.setTimeout(() => {
    boardEl.classList.remove(className);
  }, duration);
}

function spawnClearEffects(rows, cols) {
  if (!boardPanelEl || !effectLayerEl) {
    return;
  }

  const boardPanelRect = boardPanelEl.getBoundingClientRect();
  const boardRect = boardEl.getBoundingClientRect();
  const thickness = Math.max(12, Math.min(boardRect.width, boardRect.height) / 18);

  rows.forEach((row) => {
    const cellEl = boardEl.children[row * BOARD_SIZE];
    if (!cellEl) {
      return;
    }
    const rect = cellEl.getBoundingClientRect();
    createSweepEffect(
      "row",
      boardRect.left - boardPanelRect.left,
      rect.top - boardPanelRect.top + rect.height / 2 - thickness / 2,
      boardRect.width,
      thickness
    );
  });

  cols.forEach((col) => {
    const cellEl = boardEl.children[col];
    if (!cellEl) {
      return;
    }
    const rect = cellEl.getBoundingClientRect();
    createSweepEffect(
      "col",
      rect.left - boardPanelRect.left + rect.width / 2 - thickness / 2,
      boardRect.top - boardPanelRect.top,
      thickness,
      boardRect.height
    );
  });

  const affectedCells = new Set();
  rows.forEach((row) => {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      affectedCells.add(`${row}:${col}`);
    }
  });
  cols.forEach((col) => {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      affectedCells.add(`${row}:${col}`);
    }
  });

  affectedCells.forEach((key) => {
    const [row, col] = key.split(":").map(Number);
    const cellEl = boardEl.children[row * BOARD_SIZE + col];
    if (!cellEl) {
      return;
    }
    const rect = cellEl.getBoundingClientRect();
    createBurstEffect(
      rect.left - boardPanelRect.left + rect.width / 2,
      rect.top - boardPanelRect.top + rect.height / 2,
      Math.max(rect.width, rect.height) * 1.15
    );
  });

  triggerBoardImpact("clear-impact");
}

function createSweepEffect(direction, left, top, width, height) {
  const sweep = document.createElement("span");
  sweep.className = `clear-sweep ${direction}`;
  sweep.style.left = `${left}px`;
  sweep.style.top = `${top}px`;
  sweep.style.width = `${width}px`;
  sweep.style.height = `${height}px`;
  effectLayerEl.appendChild(sweep);
  sweep.addEventListener(
    "animationend",
    () => {
      sweep.remove();
    },
    { once: true }
  );
}

function createBurstEffect(centerX, centerY, size) {
  const burst = document.createElement("span");
  burst.className = "clear-burst";
  burst.style.left = `${centerX}px`;
  burst.style.top = `${centerY}px`;
  burst.style.width = `${size}px`;
  burst.style.height = `${size}px`;
  burst.style.setProperty("--burst-dx", `${(Math.random() - 0.5) * 28}px`);
  burst.style.setProperty("--burst-dy", `${(Math.random() - 0.5) * 22}px`);
  effectLayerEl.appendChild(burst);
  burst.addEventListener(
    "animationend",
    () => {
      burst.remove();
    },
    { once: true }
  );
}

function bindEvents() {
  boardEl.addEventListener("pointermove", handleBoardPointerMove);
  boardEl.addEventListener("pointerleave", clearPreview);
  boardEl.addEventListener("click", handleBoardClick);
  trayEls.forEach((slotEl) => {
    slotEl.addEventListener("pointerdown", handleTrayPointerDown);
    slotEl.addEventListener("click", () => handleSlotSelect(Number(slotEl.dataset.slotIndex)));
    if (ENABLE_TOUCH_FALLBACK) {
      slotEl.addEventListener("touchstart", handleTrayTouchStart, { passive: false });
    }
  });
  document.addEventListener("pointermove", handleGlobalPointerMove);
  document.addEventListener("pointerup", handleGlobalPointerUp);
  document.addEventListener("pointercancel", handleGlobalPointerUp);
  if (ENABLE_TOUCH_FALLBACK) {
    document.addEventListener("touchmove", handleGlobalTouchMove, { passive: false });
    document.addEventListener("touchend", handleGlobalTouchEnd, { passive: false });
    document.addEventListener("touchcancel", handleGlobalTouchEnd, { passive: false });
  }
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", persistSession);
  window.addEventListener("resize", scheduleResponsiveLayout);
  window.addEventListener("orientationchange", scheduleResponsiveLayout);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleResponsiveLayout);
    window.visualViewport.addEventListener("scroll", scheduleResponsiveLayout);
  }
  pauseButton.addEventListener("click", openPauseMenu);
  undoButton.addEventListener("click", useUndo);
  hammerButton.addEventListener("click", toggleHammerMode);
  startButton.addEventListener("click", () => {
    void startGame(1);
  });
  endlessButton.addEventListener("click", () => {
    void startEndlessGame();
  });
  continueButton.addEventListener("click", () => {
    void continueFromHome();
  });
  sidebarEntryButton.addEventListener("click", openSidebarRewardOverlay);
  resumeButton.addEventListener("click", resumeGame);
  homeButton.addEventListener("click", returnHome);
  nextLevelButton.addEventListener("click", advanceToNextLevel);
  levelHomeButton.addEventListener("click", returnHome);
  gameOverHomeButton.addEventListener("click", returnHome);
  sidebarRewardActionButton.addEventListener("click", () => {
    void handleSidebarRewardAction();
  });
  sidebarRewardCloseButton.addEventListener("click", closeSidebarRewardOverlay);
  restartButton.addEventListener("click", () => {
    void (state.mode === "endless" ? startEndlessGame() : startGame(1));
  });
  shareButton.addEventListener("click", () => {
    void shareResult();
  });
}

function syncRuntimeInfo() {
  if (runtimeStatusEl) {
    runtimeStatusEl.textContent = "";
    runtimeStatusEl.hidden = true;
  }
  if (shareButton) {
    shareButton.hidden = !platformBridge.canShare();
  }
  renderSidebarEntry();
  renderProfile();
}

function hydratePersistentState() {
  if (runtimeState.storageHydrated) {
    return;
  }
  runtimeState.storageHydrated = true;
  profile = loadProfile();
  refreshResumeState();
  renderProfile();
}

function renderProfile() {
  const levelBestScore = profile.bestScore || 0;
  const endlessBestScore = profile.endlessBestScore || 0;
  bestScoreValueEl.textContent = String(getModeBestScore());
  homeBestValueEl.textContent = String(levelBestScore);
  homeGamesValueEl.textContent = String(profile.gamesPlayed || 0);
  homeUnlockedLevelValueEl.textContent = String(getUnlockedLevel());
  endlessBestValueEl.textContent = String(endlessBestScore);
  finalBestValueEl.textContent = String(getModeBestScore());
}

function getModeBestScore(mode = state.mode) {
  return mode === "endless" ? profile.endlessBestScore || 0 : profile.bestScore || 0;
}

function getUnlockedLevel() {
  return clampLevel(profile.unlockedLevel || 1);
}

function unlockLevel(level) {
  const nextUnlockedLevel = clampLevel(level);
  if (nextUnlockedLevel <= getUnlockedLevel()) {
    return;
  }
  profile = { ...profile, unlockedLevel: nextUnlockedLevel };
  saveProfile(profile);
  renderProfile();
}

function getEndlessStageConfig(score) {
  let selected = ENDLESS_STAGE_CONFIGS[0];
  for (let index = 0; index < ENDLESS_STAGE_CONFIGS.length; index += 1) {
    if (score >= ENDLESS_STAGE_CONFIGS[index].minScore) {
      selected = ENDLESS_STAGE_CONFIGS[index];
    } else {
      break;
    }
  }
  return selected;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createEndlessSpawnConfig(score, board) {
  const stage = getEndlessStageConfig(score);
  const occupiedRatio = 1 - getEmptyCellCount(board) / (BOARD_SIZE * BOARD_SIZE);
  const pressureScale = occupiedRatio >= 0.72 ? 0.62 : occupiedRatio >= 0.6 ? 0.8 : 1;
  const targetCells = Math.max(3, Math.round(randomInt(stage.targetCellsRange[0], stage.targetCellsRange[1]) * pressureScale));
  const durabilityBudget = Math.max(
    targetCells,
    Math.round(randomInt(stage.durabilityRange[0], stage.durabilityRange[1]) * pressureScale)
  );

  return {
    targetCells,
    durabilityBudget,
    allowedShapes: stage.allowedShapes,
    maxHp: stage.maxHp,
    minGroups: stage.minGroups,
    maxGroups: stage.maxGroups,
    maxLargeGroups: stage.maxLargeGroups,
    maxHighHpGroups: stage.maxHighHpGroups,
    easyGroupTarget: stage.easyGroupTarget,
    maxCenterCells: stage.maxCenterCells,
  };
}

function stampTargetPlacements(board, placements) {
  for (let index = 0; index < placements.length; index += 1) {
    const placement = placements[index];
    for (let cellIndex = 0; cellIndex < placement.cells.length; cellIndex += 1) {
      const cell = placement.cells[cellIndex];
      board[cell[0]][cell[1]] = { type: "target", hp: placement.hp, maxHp: placement.hp };
    }
  }
}

function spawnEndlessWave(score = state.score, useInitialConfig = false) {
  const candidates = [];
  if (useInitialConfig) {
    candidates.push(ENDLESS_INITIAL_CONFIG);
  } else {
    const primaryConfig = createEndlessSpawnConfig(score, state.board);
    candidates.push(primaryConfig);
    candidates.push({
      ...primaryConfig,
      targetCells: Math.max(3, primaryConfig.targetCells - 1),
      durabilityBudget: Math.max(primaryConfig.targetCells, primaryConfig.durabilityBudget - 1),
      maxHp: Math.max(2, primaryConfig.maxHp - 1),
      maxLargeGroups: Math.max(0, primaryConfig.maxLargeGroups - 1),
      maxHighHpGroups: Math.max(0, primaryConfig.maxHighHpGroups - 1),
      easyGroupTarget: Math.max(1, primaryConfig.easyGroupTarget),
      maxCenterCells: primaryConfig.maxCenterCells + 1,
    });
  }

  for (let index = 0; index < candidates.length; index += 1) {
    const config = candidates[index];
    try {
      const groups = buildLevelGroups(config);
      const placements = placeTargetGroups(state.board, groups, config);
      stampTargetPlacements(state.board, placements);
      state.targetsRemaining = countTargets(state.board);
      state.targetsTotal = Math.max(state.targetsTotal, state.targetsRemaining);
      state.endlessWave += 1;
      return true;
    } catch {
      // try a softer config next
    }
  }

  return false;
}

function beginEndlessRun() {
  clearNotice();
  state.board = createEmptyBoard();
  state.targetsTotal = 0;
  state.targetsRemaining = 0;
  state.slots = generatePieceSet();
  state.selectedSlot = null;
  state.pendingDrag = null;
  state.dragging = null;
  state.suppressBoardClick = false;
  state.hammerMode = false;
  state.placementsCount = 0;
  state.undoSnapshot = null;
  state.preview = null;
  state.clearMarks = null;
  state.isResolving = false;
  state.pendingNextLevel = null;
  state.endlessWave = 0;
  spawnEndlessWave(0, true);
  state.targetsRemaining = countTargets(state.board);
  state.targetsTotal = Math.max(state.targetsTotal, state.targetsRemaining);
  resetDragGhost();
  showNotice("无尽模式开始：分数越高，黑块生成越快，耐久越高。");
}

function awardEndlessResources() {
  let gainedHammer = 0;
  let gainedUndo = 0;

  while (state.score >= state.endlessNextHammerScore) {
    state.hammerCount += 1;
    state.endlessNextHammerScore += ENDLESS_HAMMER_REWARD_SCORE;
    gainedHammer += 1;
  }

  while (state.score >= state.endlessNextUndoScore) {
    state.undoCount += 1;
    state.endlessNextUndoScore += ENDLESS_UNDO_REWARD_SCORE;
    gainedUndo += 1;
  }

  if (gainedHammer || gainedUndo) {
    const rewardParts = [];
    if (gainedHammer) {
      rewardParts.push(`锤子 +${gainedHammer}`);
    }
    if (gainedUndo) {
      rewardParts.push(`撤销 +${gainedUndo}`);
    }
    showNotice(`无尽奖励：${rewardParts.join("，")}`);
  }
}

function resolveEndlessProgression() {
  if (state.mode !== "endless") {
    return;
  }

  awardEndlessResources();

  let spawnedWaveCount = 0;
  while (state.score >= state.endlessNextSpawnScore && spawnedWaveCount < 2) {
    if (!spawnEndlessWave(state.score, false)) {
      break;
    }
    state.endlessNextSpawnScore += getEndlessStageConfig(state.score).spawnInterval;
    spawnedWaveCount += 1;
  }

  if (spawnedWaveCount > 0) {
    showNotice(`无尽波次 ${state.endlessWave}：新的黑块已经出现。`);
  }
}

function buildBoard() {
  const fragment = document.createDocumentFragment();
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.setAttribute("aria-label", `�?${row + 1} 行第 ${col + 1} 列`);
      fragment.appendChild(cell);
    }
  }
  boardEl.appendChild(fragment);
}

function beginLevel(level) {
  const nextLevel = clampLevel(level);
  clearNotice();
  state.currentLevel = nextLevel;
  state.targetsTotal = getLevelTargetCount(nextLevel);
  state.targetsRemaining = state.targetsTotal;
  state.board = createEmptyBoard();
  seedLevelTargets(state.board, state.targetsTotal);
  state.slots = generatePieceSet();
  state.selectedSlot = null;
  state.pendingDrag = null;
  state.dragging = null;
  state.suppressBoardClick = false;
  state.hammerMode = false;
  state.placementsCount = 0;
  state.undoSnapshot = null;
  state.preview = null;
  state.clearMarks = null;
  state.isResolving = false;
  state.pendingNextLevel = null;
  resetDragGhost();
  showNotice(`�?${state.currentLevel} 关：消除 ${state.targetsTotal} 个黑块`);
}

function showNotice(message, duration = 1800) {
  window.clearTimeout(noticeTimer);
  state.notice = message;
  if (duration > 0) {
    noticeTimer = window.setTimeout(() => {
      state.notice = "";
      renderMessage();
    }, duration);
  }
}

function clearNotice() {
  window.clearTimeout(noticeTimer);
  state.notice = "";
}

async function startGame(startLevel = 1) {
  primeAudio();
  void ensurePlatformLogin();
  window.clearTimeout(clearResolveTimer);
  clearNotice();
  pieceIdSeed = 0;
  state.mode = "level";
  state.board = createEmptyBoard();
  state.slots = [null, null, null];
  state.selectedSlot = null;
  state.pendingDrag = null;
  state.dragging = null;
  state.suppressBoardClick = false;
  state.hammerMode = false;
  state.score = 0;
  state.displayedScore = 0;
  state.currentLevel = 1;
  state.targetsTotal = 0;
  state.targetsRemaining = 0;
  state.totalRowsCleared = 0;
  state.totalColsCleared = 0;
  state.comboStreak = 0;
  state.maxCombo = 0;
  state.undoCount = 1;
  state.hammerCount = 1;
  state.placementsCount = 0;
  state.undoSnapshot = null;
  state.preview = null;
  state.clearMarks = null;
  state.isResolving = false;
  state.pendingNextLevel = null;
  state.status = "playing";
  state.sessionStartedAt = performance.now();
  state.totalPausedMs = 0;
  state.pauseStartedAt = 0;
  state.elapsedAtPause = 0;
  state.elapsedAtGameOver = 0;
  state.endReason = null;
  state.endlessWave = 0;
  state.endlessNextSpawnScore = 0;
  state.endlessNextHammerScore = 0;
  state.endlessNextUndoScore = 0;
  scoreTween = null;
  beginLevel(clampLevel(startLevel));
  const sidebarRewards = consumePendingSidebarRewards();
  if (sidebarRewards) {
    showNotice(`侧边栏奖励生效：锤子 +${sidebarRewards.hammer}，撤销 +${sidebarRewards.undo}。`, 2400);
  }
  hideAllOverlays();
  platformBridge.haptic("light");
  persistSession();
  refreshResumeState();
  render();
}

async function startEndlessGame() {
  primeAudio();
  void ensurePlatformLogin();
  window.clearTimeout(clearResolveTimer);
  clearNotice();
  pieceIdSeed = 0;
  state.mode = "endless";
  state.board = createEmptyBoard();
  state.slots = [null, null, null];
  state.selectedSlot = null;
  state.pendingDrag = null;
  state.dragging = null;
  state.suppressBoardClick = false;
  state.hammerMode = false;
  state.score = 0;
  state.displayedScore = 0;
  state.currentLevel = 1;
  state.targetsTotal = 0;
  state.targetsRemaining = 0;
  state.totalRowsCleared = 0;
  state.totalColsCleared = 0;
  state.comboStreak = 0;
  state.maxCombo = 0;
  state.undoCount = 1;
  state.hammerCount = 1;
  state.placementsCount = 0;
  state.undoSnapshot = null;
  state.preview = null;
  state.clearMarks = null;
  state.isResolving = false;
  state.pendingNextLevel = null;
  state.status = "playing";
  state.sessionStartedAt = performance.now();
  state.totalPausedMs = 0;
  state.pauseStartedAt = 0;
  state.elapsedAtPause = 0;
  state.elapsedAtGameOver = 0;
  state.endReason = null;
  state.endlessWave = 0;
  state.endlessNextSpawnScore = getEndlessStageConfig(0).spawnInterval;
  state.endlessNextHammerScore = ENDLESS_HAMMER_REWARD_SCORE;
  state.endlessNextUndoScore = ENDLESS_UNDO_REWARD_SCORE;
  scoreTween = null;
  beginEndlessRun();
  const sidebarRewards = consumePendingSidebarRewards();
  if (sidebarRewards) {
    showNotice(`侧边栏奖励生效：锤子 +${sidebarRewards.hammer}，撤销 +${sidebarRewards.undo}。`, 2400);
  }
  hideAllOverlays();
  platformBridge.haptic("light");
  persistSession();
  refreshResumeState();
  render();
}

async function continueFromHome() {
  const payload = loadSession();
  if (payload) {
    await continueSavedGame();
    return;
  }
  await startGame(getUnlockedLevel());
}

async function continueSavedGame() {
  primeAudio();
  void ensurePlatformLogin();
  const payload = loadSession();
  if (!payload) {
    refreshResumeState();
    return;
  }

  window.clearTimeout(clearResolveTimer);
  clearNotice();
  pieceIdSeed = payload.pieceIdSeed || 0;
  state.board = cloneBoard(payload.board || createEmptyBoard());
  state.slots = cloneSlots(payload.slots || [null, null, null]);
  state.selectedSlot = null;
  state.pendingDrag = null;
  state.dragging = null;
  state.suppressBoardClick = false;
  state.hammerMode = false;
  state.score = payload.score || 0;
  state.displayedScore = payload.score || 0;
  state.mode = payload.mode === "endless" ? "endless" : "level";
  state.currentLevel = clampLevel(payload.currentLevel || 1);
  state.targetsTotal =
    payload.targetsTotal ?? (state.mode === "endless" ? countTargets(state.board) : getLevelTargetCount(state.currentLevel));
  state.targetsRemaining = countTargets(state.board);
  state.totalRowsCleared = payload.totalRowsCleared || 0;
  state.totalColsCleared = payload.totalColsCleared || 0;
  state.comboStreak = payload.comboStreak || 0;
  state.maxCombo = payload.maxCombo || 0;
  state.undoCount = payload.undoCount ?? 1;
  state.hammerCount = payload.hammerCount ?? 1;
  state.placementsCount = payload.placementsCount || 0;
  state.undoSnapshot = cloneSnapshot(payload.undoSnapshot);
  state.preview = null;
  state.clearMarks = null;
  state.isResolving = false;
  state.pendingNextLevel = payload.pendingNextLevel ? clampLevel(payload.pendingNextLevel) : null;
  state.endlessWave = payload.endlessWave ?? 0;
  state.endlessNextSpawnScore = payload.endlessNextSpawnScore ?? getEndlessStageConfig(payload.score || 0).spawnInterval;
  state.endlessNextHammerScore = payload.endlessNextHammerScore ?? ENDLESS_HAMMER_REWARD_SCORE;
  state.endlessNextUndoScore = payload.endlessNextUndoScore ?? ENDLESS_UNDO_REWARD_SCORE;
  state.status = "playing";
  state.sessionStartedAt = performance.now() - (payload.elapsedMs ?? 0);
  state.totalPausedMs = 0;
  state.pauseStartedAt = 0;
  state.elapsedAtPause = payload.elapsedMs ?? 0;
  state.elapsedAtGameOver = 0;
  state.endReason = null;
  scoreTween = null;
  resetDragGhost();
  hideAllOverlays();
  platformBridge.haptic("light");
  if (state.mode === "level" && payload.status === "levelcomplete" && state.pendingNextLevel) {
    state.status = "levelcomplete";
    state.pauseStartedAt = performance.now();
    showLevelCompletePrompt(state.pendingNextLevel, false);
    refreshResumeState();
    return;
  }
  persistSession();
  refreshResumeState();
  render();
}

function returnHome() {
  window.clearTimeout(clearResolveTimer);
  clearNotice();
  state.status = "home";
  state.selectedSlot = null;
  state.pendingDrag = null;
  state.dragging = null;
  state.hammerMode = false;
  state.preview = null;
  state.clearMarks = null;
  state.isResolving = false;
  state.suppressBoardClick = false;
  state.pendingNextLevel = null;
  state.pauseStartedAt = 0;
  state.elapsedAtPause = 0;
  state.endReason = null;
  resetDragGhost();
  hideAllOverlays();
  clearSavedSession();
  refreshResumeState();
  render();
}

function showLevelCompletePrompt(nextLevel, shouldPersist = true) {
  state.elapsedAtPause = getElapsedMs();
  state.pauseStartedAt = performance.now();
  state.pendingNextLevel = clampLevel(nextLevel);
  state.status = "levelcomplete";
  state.selectedSlot = null;
  state.pendingDrag = null;
  state.dragging = null;
  state.hammerMode = false;
  state.preview = null;
  state.suppressBoardClick = false;
  resetDragGhost();
  hideAllOverlays();
  var levelCompleteEyebrowEl = levelCompleteOverlayEl.querySelector(".eyebrow");
  if (levelCompleteEyebrowEl) {
    levelCompleteEyebrowEl.textContent = "\u5173\u5361\u5b8c\u6210";
  }
  levelCompleteTitleEl.textContent = "\u7b2c " + state.currentLevel + " \u5173\u5b8c\u6210";
  levelCompleteCopyEl.textContent = "\u662f\u5426\u8fdb\u5165\u7b2c " + state.pendingNextLevel + " \u5173\uff1f";
  levelCompleteOverlayEl.classList.add("active");
  if (shouldPersist) {
    persistSession();
  }
  render();
}

function advanceToNextLevel() {
  if (state.status !== "levelcomplete" || !state.pendingNextLevel) {
    return;
  }
  state.totalPausedMs += performance.now() - state.pauseStartedAt;
  state.pauseStartedAt = 0;
  state.status = "playing";
  const nextLevel = state.pendingNextLevel;
  state.pendingNextLevel = null;
  hideAllOverlays();
  beginLevel(nextLevel);
  platformBridge.haptic("light");
  persistSession();
  refreshResumeState();
  render();
}

function openPauseMenu() {
  if (state.status !== "playing" || state.isResolving || state.dragging) {
    return;
  }
  state.elapsedAtPause = getElapsedMs();
  state.pauseStartedAt = performance.now();
  state.status = "paused";
  pauseOverlayEl.classList.add("active");
  persistSession();
  render();
}

function resumeGame() {
  if (state.status !== "paused") {
    return;
  }
  state.totalPausedMs += performance.now() - state.pauseStartedAt;
  state.pauseStartedAt = 0;
  state.status = "playing";
  pauseOverlayEl.classList.remove("active");
  platformBridge.haptic("light");
  persistSession();
  render();
}

function handleVisibilityChange() {
  if (document.visibilityState === "hidden" && state.status === "playing") {
    openPauseMenu();
  }
}

function suppressBoardClickOnce() {
  state.suppressBoardClick = true;
  window.setTimeout(() => {
    state.suppressBoardClick = false;
  }, 0);
}

function handleSlotSelect(slotIndex) {
  primeAudio();
  if (state.status !== "playing" || state.isResolving || !state.slots[slotIndex]) {
    return;
  }
  const piece = state.slots[slotIndex];
  if (state.selectedSlot === slotIndex) {
    state.selectedSlot = null;
    state.preview = null;
  } else {
    state.selectedSlot = slotIndex;
    state.hammerMode = false;
    playPickupSound(piece);
  }
  platformBridge.haptic("light");
  renderTray();
  renderBoard();
  renderMessage();
}

function handleTrayPointerDown(event) {
  primeAudio();
  if (state.status !== "playing" || state.isResolving || state.hammerMode) {
    return;
  }
  const slotEl = event.currentTarget;
  const slotIndex = Number(slotEl.dataset.slotIndex);
  const piece = state.slots[slotIndex];
  if (!piece) {
    return;
  }
  playPickupSound(piece);
  state.pendingDrag = {
    slotIndex,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
  };
  if (event.pointerType === "touch") {
    event.preventDefault();
  }
  if (slotEl.setPointerCapture) {
    slotEl.setPointerCapture(event.pointerId);
  }
}

function handleTrayTouchStart(event) {
  if (!ENABLE_TOUCH_FALLBACK || state.status !== "playing" || state.isResolving || state.hammerMode) {
    return;
  }
  if (activeTouchId !== null && (state.pendingDrag || state.dragging)) {
    return;
  }
  const touch = event.changedTouches?.[0];
  const slotEl = event.currentTarget;
  const slotIndex = Number(slotEl?.dataset.slotIndex);
  const piece = Number.isFinite(slotIndex) ? state.slots[slotIndex] : null;
  if (!touch || !piece) {
    return;
  }
  event.preventDefault();
  primeAudio();
  playPickupSound(piece);
  activeTouchId = touch.identifier;
  state.pendingDrag = {
    slotIndex,
    pointerId: `touch-${touch.identifier}`,
    startX: touch.clientX,
    startY: touch.clientY,
  };
}

function toggleHammerMode() {
  if (state.status !== "playing" || state.isResolving || state.hammerCount <= 0) {
    return;
  }
  state.hammerMode = !state.hammerMode;
  state.selectedSlot = null;
  state.preview = null;
  platformBridge.haptic("light");
  render();
}

function useUndo() {
  if (state.status !== "playing" || state.isResolving || state.undoCount <= 0 || !state.undoSnapshot) {
    return;
  }
  restoreFromSnapshot(state.undoSnapshot);
  state.undoCount -= 1;
  state.undoSnapshot = null;
  state.selectedSlot = null;
  state.pendingDrag = null;
  state.dragging = null;
  state.hammerMode = false;
  state.preview = null;
  state.suppressBoardClick = false;
  resetDragGhost();
  platformBridge.haptic("light");
  persistSession();
  render();
}

function restoreFromSnapshot(snapshot) {
  state.mode = snapshot.mode || state.mode;
  state.board = cloneBoard(snapshot.board);
  state.slots = cloneSlots(snapshot.slots);
  state.score = snapshot.score;
  state.displayedScore = snapshot.score;
  state.currentLevel = snapshot.currentLevel || state.currentLevel;
  state.targetsTotal = snapshot.targetsTotal ?? state.targetsTotal;
  state.targetsRemaining = countTargets(state.board);
  state.totalRowsCleared = snapshot.totalRowsCleared;
  state.totalColsCleared = snapshot.totalColsCleared;
  state.comboStreak = snapshot.comboStreak;
  state.maxCombo = snapshot.maxCombo;
  state.placementsCount = snapshot.placementsCount;
  state.endlessWave = snapshot.endlessWave ?? 0;
  state.endlessNextSpawnScore = snapshot.endlessNextSpawnScore ?? state.endlessNextSpawnScore;
  state.endlessNextHammerScore = snapshot.endlessNextHammerScore ?? state.endlessNextHammerScore;
  state.endlessNextUndoScore = snapshot.endlessNextUndoScore ?? state.endlessNextUndoScore;
}

function handleBoardPointerMove(event) {
  if (state.status !== "playing" || state.isResolving || state.hammerMode || state.dragging || state.selectedSlot === null) {
    return;
  }
  const cellEl = event.target.closest(".cell");
  if (!cellEl) {
    return;
  }
  const row = Number(cellEl.dataset.row);
  const col = Number(cellEl.dataset.col);
  const piece = state.slots[state.selectedSlot];
  if (!piece) {
    return;
  }
  updatePreview(row, col, state.selectedSlot, piece);
}

function handleBoardClick(event) {
  primeAudio();
  if (state.suppressBoardClick) {
    state.suppressBoardClick = false;
    return;
  }
  if (state.status !== "playing" || state.isResolving) {
    return;
  }
  const cellEl = event.target.closest(".cell");
  if (!cellEl) {
    return;
  }
  const row = Number(cellEl.dataset.row);
  const col = Number(cellEl.dataset.col);
  if (state.hammerMode) {
    useHammer(row, col);
    return;
  }
  if (state.selectedSlot === null) {
    return;
  }
  placeSelectedPiece(row, col);
}

function updateActiveDrag(pointerId, clientX, clientY) {
  if (state.status !== "playing" || state.isResolving) {
    return;
  }
  if (state.pendingDrag && state.pendingDrag.pointerId === pointerId) {
    const movedX = clientX - state.pendingDrag.startX;
    const movedY = clientY - state.pendingDrag.startY;
    const dragThreshold = String(pointerId).startsWith("touch-") ? 12 : DRAG_THRESHOLD;
    if (Math.hypot(movedX, movedY) >= dragThreshold) {
      beginDrag(state.pendingDrag.slotIndex, pointerId, clientX, clientY);
      state.pendingDrag = null;
      suppressBoardClickOnce();
    }
  }
  if (!state.dragging || state.dragging.pointerId !== pointerId) {
    return;
  }
  queueDragUpdate(clientX, clientY);
}

function finishActiveDrag(pointerId) {
  if (state.pendingDrag && state.pendingDrag.pointerId === pointerId) {
    state.pendingDrag = null;
    return;
  }
  if (!state.dragging || state.dragging.pointerId !== pointerId) {
    return;
  }
  flushDragUpdate();
  const draggingSlotIndex = state.dragging.slotIndex;
  const preview = state.preview;
  const droppedSuccessfully =
    preview &&
    preview.valid &&
    preview.slotIndex === draggingSlotIndex &&
    placePieceFromSlot(draggingSlotIndex, preview.row, preview.col);
  endDrag(draggingSlotIndex);
  suppressBoardClickOnce();
  if (!droppedSuccessfully) {
    state.selectedSlot = draggingSlotIndex;
    render();
  }
}

function findTrackedTouch(touchList, identifier) {
  if (!touchList || identifier === null) {
    return null;
  }
  for (let index = 0; index < touchList.length; index += 1) {
    if (touchList[index].identifier === identifier) {
      return touchList[index];
    }
  }
  return null;
}

function handleGlobalPointerMove(event) {
  updateActiveDrag(event.pointerId, event.clientX, event.clientY);
}

function handleGlobalTouchMove(event) {
  if (!ENABLE_TOUCH_FALLBACK || activeTouchId === null) {
    return;
  }
  const touch = findTrackedTouch(event.touches, activeTouchId) || findTrackedTouch(event.changedTouches, activeTouchId);
  if (!touch) {
    return;
  }
  if (state.pendingDrag || state.dragging) {
    event.preventDefault();
  }
  updateActiveDrag(`touch-${activeTouchId}`, touch.clientX, touch.clientY);
}

function handleGlobalPointerUp(event) {
  finishActiveDrag(event.pointerId);
}

function handleGlobalTouchEnd(event) {
  if (!ENABLE_TOUCH_FALLBACK || activeTouchId === null) {
    return;
  }
  const touch = findTrackedTouch(event.changedTouches, activeTouchId);
  if (!touch) {
    return;
  }
  const hadDragging = Boolean(state.dragging || state.pendingDrag);
  finishActiveDrag(`touch-${activeTouchId}`);
  activeTouchId = null;
  if (hadDragging) {
    event.preventDefault();
  }
}

function placeSelectedPiece(row, col) {
  if (state.selectedSlot === null) {
    return;
  }
  placePieceFromSlot(state.selectedSlot, row, col);
}

function placePieceFromSlot(slotIndex, row, col) {
  const piece = state.slots[slotIndex];
  if (!piece || !canPlacePiece(state.board, piece, row, col)) {
    platformBridge.haptic("warning");
    renderMessage();
    return false;
  }
  state.undoSnapshot = state.undoCount > 0 ? createSnapshot() : null;
  const shape = SHAPE_MAP[piece.shapeId];
  for (const [rowOffset, colOffset] of shape.cells) {
    state.board[row + rowOffset][col + colOffset] = { type: "block", colorKey: piece.colorKey };
  }
  state.slots[slotIndex] = null;
  state.selectedSlot = null;
  state.preview = null;
  state.hammerMode = false;
  state.placementsCount += 1;
  playPlacementSound(piece);
  triggerBoardImpact("place-impact", 180);
  platformBridge.haptic("light");
  render();
  resolvePlacement();
  return true;
}

function resolvePlacement() {
  const { rows, cols } = findCompletedLines(state.board);
  if (!rows.length && !cols.length) {
    state.comboStreak = 0;
    render();
    finalizeTurn();
    return;
  }
  const comboBonus = state.comboStreak * 50;
  const gainedScore = getLineScore(rows.length) + getLineScore(cols.length) + comboBonus;
  state.score += gainedScore;
  state.comboStreak += 1;
  state.maxCombo = Math.max(state.maxCombo, state.comboStreak);
  state.totalRowsCleared += rows.length;
  state.totalColsCleared += cols.length;
  state.clearMarks = { rows: new Set(rows), cols: new Set(cols) };
  state.isResolving = true;
  render();
  playClearSound(rows.length + cols.length, state.comboStreak);
  spawnClearEffects(rows, cols);
  clearResolveTimer = window.setTimeout(() => {
    applyClear(rows, cols);
    state.clearMarks = null;
    state.isResolving = false;
    state.targetsRemaining = countTargets(state.board);
    platformBridge.haptic("success");
    resolveEndlessProgression();
    if (maybeAdvanceLevel()) {
      return;
    }
    render();
    finalizeTurn();
  }, 500);
}

function finalizeTurn() {
  if (state.slots.every((piece) => piece === null)) {
    state.slots = generatePieceSet();
  }
  persistSession();
  render();
  if (!hasAnyLegalMove()) {
    endGame("failed");
  }
}

function maybeAdvanceLevel() {
  if (state.mode === "endless") {
    return false;
  }
  if (state.targetsRemaining > 0) {
    return false;
  }
  if (state.currentLevel >= TOTAL_LEVELS) {
    endGame("cleared");
    return true;
  }
  unlockLevel(state.currentLevel + 1);
  showLevelCompletePrompt(state.currentLevel + 1);
  return true;
}

// LEGACY_DUPLICATE_STUB
function endGame(reason = "failed") {}

function getLevelConfig(level) {
  return LEVEL_CONFIGS[clampLevel(level) - 1] || LEVEL_CONFIGS[0];
}

function getLevelTargetCount(level) {
  return getLevelConfig(level).durabilityBudget;
}

function countTargets(board) {
  let count = 0;
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col]?.type === "target") {
        count += board[row][col].hp || 1;
      }
    }
  }
  return count;
}

function seedLevelTargets(board) {
  const config = getLevelConfig(state.currentLevel);
  let groups = [];
  let placements = [];

  try {
    groups = buildLevelGroups(config);
    placements = placeTargetGroups(board, groups);
  } catch {
    const fallbackConfig = { ...config, allowedShapes: ["single", "domino", "triLine"], maxHp: Math.min(config.maxHp, 2) };
    groups = buildLevelGroups(fallbackConfig);
    placements = placeTargetGroups(board, groups);
  }

  for (const placement of placements) {
    for (const [row, col] of placement.cells) {
      board[row][col] = { type: "target", hp: placement.hp, maxHp: placement.hp };
    }
  }
}

function buildLevelGroups(config) {
  const shapes = chooseGroupShapes(config.targetCells, config.allowedShapes);
  const hpValues = assignGroupHp(shapes, config.durabilityBudget - config.targetCells, config.maxHp);
  return shapes.map((shapeId, index) => ({ shapeId, hp: hpValues[index] }));
}

function chooseGroupShapes(targetCells, allowedShapes) {
  const result = fillShapeCells(targetCells, allowedShapes, []);
  if (!result) {
    throw new Error(`Unable to build target groups for ${targetCells} cells.`);
  }
  return result;
}

function fillShapeCells(remainingCells, allowedShapes, picked) {
  if (remainingCells === 0) {
    return picked;
  }

  const candidates = shuffleArray(
    allowedShapes.filter((shapeId) => TARGET_SHAPE_LIBRARY[shapeId].cells.length <= remainingCells)
  );

  for (const shapeId of candidates) {
    const next = fillShapeCells(remainingCells - TARGET_SHAPE_LIBRARY[shapeId].cells.length, allowedShapes, [...picked, shapeId]);
    if (next) {
      return next;
    }
  }

  return null;
}

function assignGroupHp(shapeIds, extraDurability, maxHp) {
  const result = fillGroupHp(shapeIds, extraDurability, maxHp, 0, []);
  if (!result) {
    throw new Error(`Unable to assign target hp for extra durability ${extraDurability}.`);
  }
  return result.map((extra) => extra + 1);
}

function fillGroupHp(shapeIds, remainingExtra, maxHp, index, picked) {
  if (index >= shapeIds.length) {
    return remainingExtra === 0 ? picked : null;
  }

  const shapeSize = TARGET_SHAPE_LIBRARY[shapeIds[index]].cells.length;
  const maxExtraSteps = Math.min(maxHp - 1, Math.floor(remainingExtra / shapeSize));
  const candidates = shuffleArray(Array.from({ length: maxExtraSteps + 1 }, (_, value) => value));

  for (const extraStep of candidates) {
    const next = fillGroupHp(shapeIds, remainingExtra - extraStep * shapeSize, maxHp, index + 1, [...picked, extraStep]);
    if (next) {
      return next;
    }
  }

  return null;
}

function placeTargetGroups(board, groups) {
  const orderedGroups = [...groups].sort(
    (left, right) => TARGET_SHAPE_LIBRARY[right.shapeId].cells.length - TARGET_SHAPE_LIBRARY[left.shapeId].cells.length
  );

  for (const spacing of [1, 0]) {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const workingBoard = cloneBoard(board);
      const placements = [];
      let failed = false;

      for (const group of orderedGroups) {
        const placement = findRandomPlacement(workingBoard, group, spacing);
        if (!placement) {
          failed = true;
          break;
        }
        stampTargetGroup(workingBoard, placement.cells, group.hp);
        placements.push(placement);
      }

      if (!failed) {
        return placements;
      }
    }
  }

  throw new Error(`Unable to place target groups for level ${state.currentLevel}.`);
}

function findRandomPlacement(board, group, spacing) {
  const candidates = [];
  for (const variant of getTargetShapeVariants(group.shapeId)) {
    for (let row = 0; row <= BOARD_SIZE - variant.height; row += 1) {
      for (let col = 0; col <= BOARD_SIZE - variant.width; col += 1) {
        const absoluteCells = variant.cells.map(([cellRow, cellCol]) => [row + cellRow, col + cellCol]);
        if (canPlaceTargetGroup(board, absoluteCells, spacing)) {
          candidates.push({ hp: group.hp, cells: absoluteCells });
        }
      }
    }
  }

  if (!candidates.length) {
    return null;
  }

  return randomChoice(candidates);
}

function canPlaceTargetGroup(board, cells, spacing) {
  for (const [row, col] of cells) {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      return false;
    }
    if (isCornerCell(row, col) || board[row][col] !== null) {
      return false;
    }

    for (let deltaRow = -spacing; deltaRow <= spacing; deltaRow += 1) {
      for (let deltaCol = -spacing; deltaCol <= spacing; deltaCol += 1) {
        const nextRow = row + deltaRow;
        const nextCol = col + deltaCol;
        if (nextRow < 0 || nextRow >= BOARD_SIZE || nextCol < 0 || nextCol >= BOARD_SIZE) {
          continue;
        }
        if (board[nextRow][nextCol]?.type === "target") {
          return false;
        }
      }
    }
  }
  return true;
}

function stampTargetGroup(board, cells, hp) {
  for (const [row, col] of cells) {
    board[row][col] = { type: "target", hp, maxHp: hp };
  }
}

function getTargetShapeVariants(shapeId) {
  const baseShape = TARGET_SHAPE_LIBRARY[shapeId];
  const variants = [];
  let current = baseShape.cells;

  for (let rotation = 0; rotation < 4; rotation += 1) {
    const normalized = normalizeCells(current);
    const signature = getCellsSignature(normalized);
    if (!variants.some((variant) => variant.signature === signature)) {
      const maxRow = Math.max(...normalized.map(([row]) => row));
      const maxCol = Math.max(...normalized.map(([, col]) => col));
      variants.push({
        signature,
        width: maxCol + 1,
        height: maxRow + 1,
        cells: normalized,
      });
    }
    current = rotateCellsClockwise(current);
  }

  return variants;
}

function rotateCellsClockwise(cells) {
  const maxRow = Math.max(...cells.map(([row]) => row));
  return cells.map(([row, col]) => [col, maxRow - row]);
}

function normalizeCells(cells) {
  const minRow = Math.min(...cells.map(([row]) => row));
  const minCol = Math.min(...cells.map(([, col]) => col));
  return cells
    .map(([row, col]) => [row - minRow, col - minCol])
    .sort((left, right) => left[0] - right[0] || left[1] - right[1]);
}

function getCellsSignature(cells) {
  return cells.map(([row, col]) => `${row}:${col}`).join("|");
}

function shuffleArray(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function applyClear(rows, cols) {
  const rowSet = new Set(rows);
  const colSet = new Set(cols);
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const cell = state.board[row][col];
      if (!cell || !(rowSet.has(row) || colSet.has(col))) {
        continue;
      }
      if (cell.type === "block") {
        state.board[row][col] = null;
      } else if (cell.type === "target") {
        cell.hp -= 1;
        if (cell.hp <= 0) {
          state.board[row][col] = null;
        }
      }
    }
  }

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const cell = state.board[row][col];
      if (!cell || cell.type !== "obstacle") {
        continue;
      }
      if (rowSet.has(row) || colSet.has(col)) {
        cell.hp -= 1;
        if (cell.hp <= 0) {
          state.board[row][col] = null;
        }
      }
    }
  }
}

function useHammer(row, col) {
  const cell = state.board[row][col];
  if (!cell) {
    platformBridge.haptic("warning");
    renderMessage();
    return;
  }

  if (cell.type === "target") {
    cell.hp -= 1;
    if (cell.hp <= 0) {
      state.board[row][col] = null;
    }
  } else {
    state.board[row][col] = null;
  }

  state.hammerCount -= 1;
  state.hammerMode = false;
  state.undoSnapshot = null;
  state.targetsRemaining = countTargets(state.board);
  platformBridge.haptic("success");
  if (maybeAdvanceLevel()) {
    return;
  }
  persistSession();
  render();
}

function beginLevel(level) {
  const nextLevel = clampLevel(level);
  const config = getLevelConfig(nextLevel);

  clearNotice();
  state.currentLevel = nextLevel;
  state.targetsTotal = config.durabilityBudget;
  state.board = createEmptyBoard();
  seedLevelTargets(state.board);
  state.targetsRemaining = countTargets(state.board);
  state.slots = generatePieceSet();
  state.selectedSlot = null;
  state.pendingDrag = null;
  state.dragging = null;
  state.suppressBoardClick = false;
  state.hammerMode = false;
  state.placementsCount = 0;
  state.undoSnapshot = null;
  state.preview = null;
  state.clearMarks = null;
  state.isResolving = false;
  state.pendingNextLevel = null;
  resetDragGhost();
  showNotice(`�?${state.currentLevel} 关：${config.targetCells} 格目标，总耐久 ${config.durabilityBudget}`);
}

function renderBoard() {
  const cells = boardEl.children;
  const previewMap = getPreviewCells();

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const index = row * BOARD_SIZE + col;
      const cellEl = cells[index];
      const cellData = state.board[row][col];
      const isClearing = state.clearMarks && (state.clearMarks.rows.has(row) || state.clearMarks.cols.has(col));
      const previewColor = previewMap.get(`${row}-${col}`);

      cellEl.className = "cell";
      cellEl.innerHTML = "";

      if (previewColor) {
        cellEl.classList.add("preview-valid", previewColor);
      }
      if (isClearing) {
        cellEl.classList.add("clearing");
      }
      if (!cellData) {
        continue;
      }

      if (cellData.type === "block") {
        const block = document.createElement("span");
        block.className = `block ${cellData.colorKey}`;
        cellEl.appendChild(block);
      } else if (cellData.type === "target") {
        const target = document.createElement("span");
        target.className = `target-block hp-${Math.min(4, Math.max(1, cellData.hp || 1))}`;
        target.textContent = String(cellData.hp || 1);
        cellEl.appendChild(target);
      } else {
        const obstacle = document.createElement("span");
        obstacle.className = "obstacle";
        obstacle.textContent = String(cellData.hp);
        cellEl.appendChild(obstacle);
      }
    }
  }
}

// LEGACY_DUPLICATE_STUB
function renderHud() {}

function renderMessage() {}

function refreshResumeState() {}

function endGame(reason = "failed") {}

function getLevelConfig(level) {
  return LEVEL_CONFIGS[clampLevel(level) - 1] || LEVEL_CONFIGS[0];
}

function getLevelTargetCount(level) {
  return getLevelConfig(level).durabilityBudget;
}

function countTargets(board) {
  let count = 0;
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col]?.type === "target") {
        count += board[row][col].hp || 1;
      }
    }
  }
  return count;
}

function seedLevelTargets(board) {
  const config = getLevelConfig(state.currentLevel);
  let groups = [];
  let placements = [];

  try {
    groups = buildLevelGroups(config);
    placements = placeTargetGroups(board, groups);
  } catch {
    const fallbackConfig = { ...config, allowedShapes: ["single", "domino", "triLine"], maxHp: Math.min(config.maxHp, 2) };
    groups = buildLevelGroups(fallbackConfig);
    placements = placeTargetGroups(board, groups);
  }

  for (const placement of placements) {
    for (const [row, col] of placement.cells) {
      board[row][col] = { type: "target", hp: placement.hp, maxHp: placement.hp };
    }
  }
}

function buildLevelGroups(config) {
  const shapes = chooseGroupShapes(config.targetCells, config.allowedShapes);
  const hpValues = assignGroupHp(shapes, config.durabilityBudget - config.targetCells, config.maxHp);
  return shapes.map((shapeId, index) => ({ shapeId, hp: hpValues[index] }));
}

function chooseGroupShapes(targetCells, allowedShapes) {
  const result = fillShapeCells(targetCells, allowedShapes, []);
  if (!result) {
    throw new Error(`Unable to build target groups for ${targetCells} cells.`);
  }
  return result;
}

function fillShapeCells(remainingCells, allowedShapes, picked) {
  if (remainingCells === 0) {
    return picked;
  }

  const candidates = shuffleArray(
    allowedShapes.filter((shapeId) => TARGET_SHAPE_LIBRARY[shapeId].cells.length <= remainingCells)
  );

  for (const shapeId of candidates) {
    const next = fillShapeCells(remainingCells - TARGET_SHAPE_LIBRARY[shapeId].cells.length, allowedShapes, [...picked, shapeId]);
    if (next) {
      return next;
    }
  }

  return null;
}

function assignGroupHp(shapeIds, extraDurability, maxHp) {
  const result = fillGroupHp(shapeIds, extraDurability, maxHp, 0, []);
  if (!result) {
    throw new Error(`Unable to assign target hp for extra durability ${extraDurability}.`);
  }
  return result.map((extra) => extra + 1);
}

function fillGroupHp(shapeIds, remainingExtra, maxHp, index, picked) {
  if (index >= shapeIds.length) {
    return remainingExtra === 0 ? picked : null;
  }

  const shapeSize = TARGET_SHAPE_LIBRARY[shapeIds[index]].cells.length;
  const maxExtraSteps = Math.min(maxHp - 1, Math.floor(remainingExtra / shapeSize));
  const candidates = shuffleArray(Array.from({ length: maxExtraSteps + 1 }, (_, value) => value));

  for (const extraStep of candidates) {
    const next = fillGroupHp(shapeIds, remainingExtra - extraStep * shapeSize, maxHp, index + 1, [...picked, extraStep]);
    if (next) {
      return next;
    }
  }

  return null;
}

function placeTargetGroups(board, groups) {
  const orderedGroups = [...groups].sort(
    (left, right) => TARGET_SHAPE_LIBRARY[right.shapeId].cells.length - TARGET_SHAPE_LIBRARY[left.shapeId].cells.length
  );

  for (const spacing of [1, 0]) {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const workingBoard = cloneBoard(board);
      const placements = [];
      let failed = false;

      for (const group of orderedGroups) {
        const placement = findRandomPlacement(workingBoard, group, spacing);
        if (!placement) {
          failed = true;
          break;
        }
        stampTargetGroup(workingBoard, placement.cells, group.hp);
        placements.push(placement);
      }

      if (!failed) {
        return placements;
      }
    }
  }

  throw new Error(`Unable to place target groups for level ${state.currentLevel}.`);
}

function findRandomPlacement(board, group, spacing) {
  const candidates = [];
  for (const variant of getTargetShapeVariants(group.shapeId)) {
    for (let row = 0; row <= BOARD_SIZE - variant.height; row += 1) {
      for (let col = 0; col <= BOARD_SIZE - variant.width; col += 1) {
        const absoluteCells = variant.cells.map(([cellRow, cellCol]) => [row + cellRow, col + cellCol]);
        if (canPlaceTargetGroup(board, absoluteCells, spacing)) {
          candidates.push({ hp: group.hp, cells: absoluteCells });
        }
      }
    }
  }

  if (!candidates.length) {
    return null;
  }

  return randomChoice(candidates);
}

function canPlaceTargetGroup(board, cells, spacing) {
  for (const [row, col] of cells) {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      return false;
    }
    if (isCornerCell(row, col) || board[row][col] !== null) {
      return false;
    }

    for (let deltaRow = -spacing; deltaRow <= spacing; deltaRow += 1) {
      for (let deltaCol = -spacing; deltaCol <= spacing; deltaCol += 1) {
        const nextRow = row + deltaRow;
        const nextCol = col + deltaCol;
        if (nextRow < 0 || nextRow >= BOARD_SIZE || nextCol < 0 || nextCol >= BOARD_SIZE) {
          continue;
        }
        if (board[nextRow][nextCol]?.type === "target") {
          return false;
        }
      }
    }
  }
  return true;
}

function stampTargetGroup(board, cells, hp) {
  for (const [row, col] of cells) {
    board[row][col] = { type: "target", hp, maxHp: hp };
  }
}

function getTargetShapeVariants(shapeId) {
  const baseShape = TARGET_SHAPE_LIBRARY[shapeId];
  const variants = [];
  let current = baseShape.cells;

  for (let rotation = 0; rotation < 4; rotation += 1) {
    const normalized = normalizeCells(current);
    const signature = getCellsSignature(normalized);
    if (!variants.some((variant) => variant.signature === signature)) {
      const maxRow = Math.max(...normalized.map(([row]) => row));
      const maxCol = Math.max(...normalized.map(([, col]) => col));
      variants.push({
        signature,
        width: maxCol + 1,
        height: maxRow + 1,
        cells: normalized,
      });
    }
    current = rotateCellsClockwise(current);
  }

  return variants;
}

function rotateCellsClockwise(cells) {
  const maxRow = Math.max(...cells.map(([row]) => row));
  return cells.map(([row, col]) => [col, maxRow - row]);
}

function normalizeCells(cells) {
  const minRow = Math.min(...cells.map(([row]) => row));
  const minCol = Math.min(...cells.map(([, col]) => col));
  return cells
    .map(([row, col]) => [row - minRow, col - minCol])
    .sort((left, right) => left[0] - right[0] || left[1] - right[1]);
}

function getCellsSignature(cells) {
  return cells.map(([row, col]) => `${row}:${col}`).join("|");
}

function shuffleArray(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function applyClear(rows, cols) {
  const rowSet = new Set(rows);
  const colSet = new Set(cols);
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const cell = state.board[row][col];
      if (!cell || !(rowSet.has(row) || colSet.has(col))) {
        continue;
      }
      if (cell.type === "block") {
        state.board[row][col] = null;
      } else if (cell.type === "target") {
        cell.hp -= 1;
        if (cell.hp <= 0) {
          state.board[row][col] = null;
        }
      }
    }
  }

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const cell = state.board[row][col];
      if (!cell || cell.type !== "obstacle") {
        continue;
      }
      if (rowSet.has(row) || colSet.has(col)) {
        cell.hp -= 1;
        if (cell.hp <= 0) {
          state.board[row][col] = null;
        }
      }
    }
  }
}

function useHammer(row, col) {
  const cell = state.board[row][col];
  if (!cell) {
    platformBridge.haptic("warning");
    renderMessage();
    return;
  }

  if (cell.type === "target") {
    cell.hp -= 1;
    if (cell.hp <= 0) {
      state.board[row][col] = null;
    }
  } else {
    state.board[row][col] = null;
  }

  state.hammerCount -= 1;
  state.hammerMode = false;
  state.undoSnapshot = null;
  state.targetsRemaining = countTargets(state.board);
  platformBridge.haptic("success");
  if (maybeAdvanceLevel()) {
    return;
  }
  persistSession();
  render();
}

function beginLevel(level) {
  const nextLevel = clampLevel(level);
  const config = getLevelConfig(nextLevel);

  clearNotice();
  state.currentLevel = nextLevel;
  state.targetsTotal = config.durabilityBudget;
  state.board = createEmptyBoard();
  seedLevelTargets(state.board);
  state.targetsRemaining = countTargets(state.board);
  state.slots = generatePieceSet();
  state.selectedSlot = null;
  state.pendingDrag = null;
  state.dragging = null;
  state.suppressBoardClick = false;
  state.hammerMode = false;
  state.placementsCount = 0;
  state.undoSnapshot = null;
  state.preview = null;
  state.clearMarks = null;
  state.isResolving = false;
  state.pendingNextLevel = null;
  resetDragGhost();
  showNotice(`�?${state.currentLevel} 关：${config.targetCells} 格目标，总耐久 ${config.durabilityBudget}`);
}

function renderBoard() {
  const cells = boardEl.children;
  const previewMap = getPreviewCells();

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const index = row * BOARD_SIZE + col;
      const cellEl = cells[index];
      const cellData = state.board[row][col];
      const isClearing = state.clearMarks && (state.clearMarks.rows.has(row) || state.clearMarks.cols.has(col));
      const previewColor = previewMap.get(`${row}-${col}`);

      cellEl.className = "cell";
      cellEl.innerHTML = "";

      if (previewColor) {
        cellEl.classList.add("preview-valid", previewColor);
      }
      if (isClearing) {
        cellEl.classList.add("clearing");
      }
      if (!cellData) {
        continue;
      }

      if (cellData.type === "block") {
        const block = document.createElement("span");
        block.className = `block ${cellData.colorKey}`;
        cellEl.appendChild(block);
      } else if (cellData.type === "target") {
        const target = document.createElement("span");
        target.className = `target-block hp-${Math.min(4, Math.max(1, cellData.hp || 1))}`;
        target.textContent = String(cellData.hp || 1);
        cellEl.appendChild(target);
      } else {
        const obstacle = document.createElement("span");
        obstacle.className = "obstacle";
        obstacle.textContent = String(cellData.hp);
        cellEl.appendChild(obstacle);
      }
    }
  }
}

// LEGACY_DUPLICATE_STUB
function renderHud() {}

function renderMessage() {}

function refreshResumeState() {}

function endGame(reason = "failed") {}

const TARGET_SHAPE_LIBRARY = {
  single: { cells: [[0, 0]] },
  domino: { cells: [[0, 0], [0, 1]] },
  triLine: { cells: [[0, 0], [0, 1], [0, 2]] },
  triL: { cells: [[0, 0], [1, 0], [1, 1]] },
  line4: { cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  square: { cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  l4: { cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
  t4: { cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
  ring: { cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2]] },
};

const LEVEL_CONFIGS = [
  { targetCells: 3, durabilityBudget: 3, allowedShapes: ["single"], maxHp: 1 },
  { targetCells: 4, durabilityBudget: 4, allowedShapes: ["single", "domino"], maxHp: 1 },
  { targetCells: 5, durabilityBudget: 5, allowedShapes: ["single", "domino", "triLine"], maxHp: 1 },
  { targetCells: 6, durabilityBudget: 6, allowedShapes: ["domino", "triLine", "triL"], maxHp: 1 },
  { targetCells: 6, durabilityBudget: 7, allowedShapes: ["domino", "triLine", "triL"], maxHp: 2 },
  { targetCells: 7, durabilityBudget: 8, allowedShapes: ["domino", "triLine", "triL", "line4"], maxHp: 2 },
  { targetCells: 8, durabilityBudget: 8, allowedShapes: ["triLine", "triL", "line4", "square"], maxHp: 1 },
  { targetCells: 8, durabilityBudget: 10, allowedShapes: ["triLine", "triL", "line4", "square"], maxHp: 2 },
  { targetCells: 9, durabilityBudget: 11, allowedShapes: ["triLine", "triL", "line4", "square", "l4"], maxHp: 2 },
  { targetCells: 9, durabilityBudget: 12, allowedShapes: ["triLine", "triL", "line4", "square", "t4"], maxHp: 2 },
  { targetCells: 10, durabilityBudget: 13, allowedShapes: ["triL", "line4", "square", "l4", "t4"], maxHp: 2 },
  { targetCells: 10, durabilityBudget: 15, allowedShapes: ["triL", "line4", "square", "l4", "t4"], maxHp: 2 },
  { targetCells: 11, durabilityBudget: 17, allowedShapes: ["line4", "square", "l4", "t4"], maxHp: 3 },
  { targetCells: 12, durabilityBudget: 18, allowedShapes: ["line4", "square", "l4", "t4"], maxHp: 3 },
  { targetCells: 12, durabilityBudget: 20, allowedShapes: ["square", "l4", "t4", "ring"], maxHp: 3 },
  { targetCells: 13, durabilityBudget: 22, allowedShapes: ["square", "l4", "t4", "ring"], maxHp: 3 },
  { targetCells: 14, durabilityBudget: 24, allowedShapes: ["line4", "l4", "t4", "ring"], maxHp: 3 },
  { targetCells: 14, durabilityBudget: 27, allowedShapes: ["square", "l4", "t4", "ring"], maxHp: 4 },
  { targetCells: 15, durabilityBudget: 30, allowedShapes: ["square", "l4", "t4", "ring"], maxHp: 4 },
  { targetCells: 16, durabilityBudget: 34, allowedShapes: ["line4", "square", "l4", "t4", "ring"], maxHp: 4 },
];

function getLevelConfig(level) {
  return LEVEL_CONFIGS[clampLevel(level) - 1] || LEVEL_CONFIGS[0];
}

function getLevelTargetCount(level) {
  return getLevelConfig(level).durabilityBudget;
}

function countTargets(board) {
  let count = 0;
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col]?.type === "target") {
        count += board[row][col].hp || 1;
      }
    }
  }
  return count;
}

function seedLevelTargets(board) {
  const config = getLevelConfig(state.currentLevel);
  let groups = [];
  let placements = [];

  try {
    groups = buildLevelGroups(config);
    placements = placeTargetGroups(board, groups);
  } catch {
    const fallbackConfig = { ...config, allowedShapes: ["single", "domino", "triLine"], maxHp: Math.min(config.maxHp, 2) };
    groups = buildLevelGroups(fallbackConfig);
    placements = placeTargetGroups(board, groups);
  }

  for (const placement of placements) {
    for (const [row, col] of placement.cells) {
      board[row][col] = { type: "target", hp: placement.hp, maxHp: placement.hp };
    }
  }
}

function buildLevelGroups(config) {
  const shapes = chooseGroupShapes(config.targetCells, config.allowedShapes);
  const hpValues = assignGroupHp(shapes, config.durabilityBudget - config.targetCells, config.maxHp);
  return shapes.map((shapeId, index) => ({ shapeId, hp: hpValues[index] }));
}

function chooseGroupShapes(targetCells, allowedShapes) {
  const result = fillShapeCells(targetCells, allowedShapes, []);
  if (!result) {
    throw new Error(`Unable to build target groups for ${targetCells} cells.`);
  }
  return result;
}

function fillShapeCells(remainingCells, allowedShapes, picked) {
  if (remainingCells === 0) {
    return picked;
  }

  const candidates = shuffleArray(
    allowedShapes.filter((shapeId) => TARGET_SHAPE_LIBRARY[shapeId].cells.length <= remainingCells)
  );

  for (const shapeId of candidates) {
    const next = fillShapeCells(remainingCells - TARGET_SHAPE_LIBRARY[shapeId].cells.length, allowedShapes, [...picked, shapeId]);
    if (next) {
      return next;
    }
  }

  return null;
}

function assignGroupHp(shapeIds, extraDurability, maxHp) {
  const result = fillGroupHp(shapeIds, extraDurability, maxHp, 0, []);
  if (!result) {
    throw new Error(`Unable to assign target hp for extra durability ${extraDurability}.`);
  }
  return result.map((extra) => extra + 1);
}

function fillGroupHp(shapeIds, remainingExtra, maxHp, index, picked) {
  if (index >= shapeIds.length) {
    return remainingExtra === 0 ? picked : null;
  }

  const shapeSize = TARGET_SHAPE_LIBRARY[shapeIds[index]].cells.length;
  const maxExtraSteps = Math.min(maxHp - 1, Math.floor(remainingExtra / shapeSize));
  const candidates = shuffleArray(Array.from({ length: maxExtraSteps + 1 }, (_, value) => value));

  for (const extraStep of candidates) {
    const next = fillGroupHp(shapeIds, remainingExtra - extraStep * shapeSize, maxHp, index + 1, [...picked, extraStep]);
    if (next) {
      return next;
    }
  }

  return null;
}

function placeTargetGroups(board, groups) {
  const orderedGroups = [...groups].sort(
    (left, right) => TARGET_SHAPE_LIBRARY[right.shapeId].cells.length - TARGET_SHAPE_LIBRARY[left.shapeId].cells.length
  );

  for (const spacing of [1, 0]) {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const workingBoard = cloneBoard(board);
      const placements = [];
      let failed = false;

      for (const group of orderedGroups) {
        const placement = findRandomPlacement(workingBoard, group, spacing);
        if (!placement) {
          failed = true;
          break;
        }
        stampTargetGroup(workingBoard, placement.cells, group.hp);
        placements.push(placement);
      }

      if (!failed) {
        return placements;
      }
    }
  }

  throw new Error(`Unable to place target groups for level ${state.currentLevel}.`);
}

function findRandomPlacement(board, group, spacing) {
  const candidates = [];
  for (const variant of getTargetShapeVariants(group.shapeId)) {
    for (let row = 0; row <= BOARD_SIZE - variant.height; row += 1) {
      for (let col = 0; col <= BOARD_SIZE - variant.width; col += 1) {
        const absoluteCells = variant.cells.map(([cellRow, cellCol]) => [row + cellRow, col + cellCol]);
        if (canPlaceTargetGroup(board, absoluteCells, spacing)) {
          candidates.push({ hp: group.hp, cells: absoluteCells });
        }
      }
    }
  }

  if (!candidates.length) {
    return null;
  }

  return randomChoice(candidates);
}

function canPlaceTargetGroup(board, cells, spacing) {
  for (const [row, col] of cells) {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      return false;
    }
    if (isCornerCell(row, col) || board[row][col] !== null) {
      return false;
    }

    for (let deltaRow = -spacing; deltaRow <= spacing; deltaRow += 1) {
      for (let deltaCol = -spacing; deltaCol <= spacing; deltaCol += 1) {
        const nextRow = row + deltaRow;
        const nextCol = col + deltaCol;
        if (nextRow < 0 || nextRow >= BOARD_SIZE || nextCol < 0 || nextCol >= BOARD_SIZE) {
          continue;
        }
        if (board[nextRow][nextCol]?.type === "target") {
          return false;
        }
      }
    }
  }
  return true;
}

function stampTargetGroup(board, cells, hp) {
  for (const [row, col] of cells) {
    board[row][col] = { type: "target", hp, maxHp: hp };
  }
}

function getTargetShapeVariants(shapeId) {
  const baseShape = TARGET_SHAPE_LIBRARY[shapeId];
  const variants = [];
  let current = baseShape.cells;

  for (let rotation = 0; rotation < 4; rotation += 1) {
    const normalized = normalizeCells(current);
    const signature = getCellsSignature(normalized);
    if (!variants.some((variant) => variant.signature === signature)) {
      const maxRow = Math.max(...normalized.map(([row]) => row));
      const maxCol = Math.max(...normalized.map(([, col]) => col));
      variants.push({
        signature,
        width: maxCol + 1,
        height: maxRow + 1,
        cells: normalized,
      });
    }
    current = rotateCellsClockwise(current);
  }

  return variants;
}

function rotateCellsClockwise(cells) {
  const maxRow = Math.max(...cells.map(([row]) => row));
  return cells.map(([row, col]) => [col, maxRow - row]);
}

function normalizeCells(cells) {
  const minRow = Math.min(...cells.map(([row]) => row));
  const minCol = Math.min(...cells.map(([, col]) => col));
  return cells
    .map(([row, col]) => [row - minRow, col - minCol])
    .sort((left, right) => left[0] - right[0] || left[1] - right[1]);
}

function getCellsSignature(cells) {
  return cells.map(([row, col]) => `${row}:${col}`).join("|");
}

function shuffleArray(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function applyClear(rows, cols) {
  const rowSet = new Set(rows);
  const colSet = new Set(cols);
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const cell = state.board[row][col];
      if (!cell) {
        continue;
      }
      if (!(rowSet.has(row) || colSet.has(col))) {
        continue;
      }

      if (cell.type === "block") {
        state.board[row][col] = null;
        continue;
      }

      if (cell.type === "target") {
        cell.hp -= 1;
        if (cell.hp <= 0) {
          state.board[row][col] = null;
        }
      }
    }
  }

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const cell = state.board[row][col];
      if (!cell || cell.type !== "obstacle") {
        continue;
      }
      if (rowSet.has(row) || colSet.has(col)) {
        cell.hp -= 1;
        if (cell.hp <= 0) {
          state.board[row][col] = null;
        }
      }
    }
  }
}

function useHammer(row, col) {
  const cell = state.board[row][col];
  if (!cell) {
    platformBridge.haptic("warning");
    renderMessage();
    return;
  }

  if (cell.type === "target") {
    cell.hp -= 1;
    if (cell.hp <= 0) {
      state.board[row][col] = null;
    }
  } else {
    state.board[row][col] = null;
  }

  state.hammerCount -= 1;
  state.hammerMode = false;
  state.undoSnapshot = null;
  state.targetsRemaining = countTargets(state.board);
  platformBridge.haptic("success");
  if (maybeAdvanceLevel()) {
    return;
  }
  persistSession();
  render();
}

function beginLevel(level) {
  const nextLevel = clampLevel(level);
  const config = getLevelConfig(nextLevel);

  clearNotice();
  state.currentLevel = nextLevel;
  state.targetsTotal = config.durabilityBudget;
  state.board = createEmptyBoard();
  seedLevelTargets(state.board);
  state.targetsRemaining = countTargets(state.board);
  state.slots = generatePieceSet();
  state.selectedSlot = null;
  state.pendingDrag = null;
  state.dragging = null;
  state.suppressBoardClick = false;
  state.hammerMode = false;
  state.placementsCount = 0;
  state.undoSnapshot = null;
  state.preview = null;
  state.clearMarks = null;
  state.isResolving = false;
  state.pendingNextLevel = null;
  resetDragGhost();
  showNotice(`�?${state.currentLevel} 关：${config.targetCells} 格目标，总耐久 ${config.durabilityBudget}`);
}

function renderBoard() {
  const cells = boardEl.children;
  const previewMap = getPreviewCells();

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const index = row * BOARD_SIZE + col;
      const cellEl = cells[index];
      const cellData = state.board[row][col];
      const isClearing = state.clearMarks && (state.clearMarks.rows.has(row) || state.clearMarks.cols.has(col));
      const previewColor = previewMap.get(`${row}-${col}`);

      cellEl.className = "cell";
      cellEl.innerHTML = "";

      if (previewColor) {
        cellEl.classList.add("preview-valid", previewColor);
      }
      if (isClearing) {
        cellEl.classList.add("clearing");
      }
      if (!cellData) {
        continue;
      }

      if (cellData.type === "block") {
        const block = document.createElement("span");
        block.className = `block ${cellData.colorKey}`;
        cellEl.appendChild(block);
        continue;
      }

      if (cellData.type === "target") {
        const target = document.createElement("span");
        target.className = `target-block hp-${Math.min(4, Math.max(1, cellData.hp || 1))}`;
        target.textContent = String(cellData.hp || 1);
        cellEl.appendChild(target);
        continue;
      }

      const obstacle = document.createElement("span");
      obstacle.className = "obstacle";
      obstacle.textContent = String(cellData.hp);
      cellEl.appendChild(obstacle);
    }
  }
}

// LEGACY_DUPLICATE_STUB
function renderHud() {}

function renderMessage() {}

function refreshResumeState() {}

function endGame(reason = "failed") {}

function updateProfileAfterGame() {
  profile = {
    ...profile,
    bestScore: state.mode === "endless" ? profile.bestScore || 0 : Math.max(profile.bestScore || 0, state.score),
    endlessBestScore:
      state.mode === "endless" ? Math.max(profile.endlessBestScore || 0, state.score) : profile.endlessBestScore || 0,
    gamesPlayed: (profile.gamesPlayed || 0) + 1,
    totalPlayMs: (profile.totalPlayMs || 0) + state.elapsedAtGameOver,
  };
  saveProfile(profile);
  renderProfile();
}

function useHammer(row, col) {
  const cell = state.board[row][col];
  if (!cell) {
    platformBridge.haptic("warning");
    renderMessage();
    return;
  }
  state.board[row][col] = null;
  state.hammerCount -= 1;
  state.hammerMode = false;
  state.undoSnapshot = null;
  state.targetsRemaining = countTargets(state.board);
  platformBridge.haptic("success");
  if (maybeAdvanceLevel()) {
    return;
  }
  persistSession();
  render();
}

function beginDrag(slotIndex, pointerId, clientX, clientY) {
  const piece = state.slots[slotIndex];
  if (!piece) {
    return;
  }
  state.dragging = { slotIndex, pointerId, ...getDragAnchorMetrics(slotIndex, piece, clientX, clientY) };
  state.selectedSlot = slotIndex;
  state.hammerMode = false;
  renderDragGhost(piece);
  updateDragPosition(clientX, clientY);
  updatePreviewFromPoint(clientX, clientY, slotIndex);
  renderTray();
  renderMessage();
}

function endDrag(slotIndex) {
  state.dragging = null;
  state.preview = null;
  resetDragGhost();
  if (state.selectedSlot === slotIndex && !state.slots[slotIndex]) {
    state.selectedSlot = null;
  }
  renderBoard();
  renderTray();
  renderMessage();
}

function updateDragPosition(clientX, clientY) {
  const ghostOffsetX = state.dragging?.ghostOffsetX ?? 0;
  const ghostOffsetY = state.dragging?.ghostOffsetY ?? 0;
  dragGhostEl.style.left = `${clientX - ghostOffsetX}px`;
  dragGhostEl.style.top = `${clientY - ghostOffsetY}px`;
}

function updatePreviewFromPoint(clientX, clientY, slotIndex) {
  const piece = state.slots[slotIndex];
  if (!piece) {
    return;
  }
  const boardCell = getBoardCellFromPoint(clientX, clientY);
  if (!boardCell) {
    if (state.preview) {
      state.preview = null;
      renderBoard();
      renderMessage();
    }
    dragGhostEl.classList.add("invalid");
    return;
  }
  const anchorRow = state.dragging?.slotIndex === slotIndex ? state.dragging.anchorRow : 0;
  const anchorCol = state.dragging?.slotIndex === slotIndex ? state.dragging.anchorCol : 0;
  updatePreview(boardCell.row - anchorRow, boardCell.col - anchorCol, slotIndex, piece);
}

function updatePreview(row, col, slotIndex, piece) {
  const valid = canPlacePiece(state.board, piece, row, col);
  const previousPreview = state.preview;
  if (previousPreview && previousPreview.row === row && previousPreview.col === col && previousPreview.valid === valid && previousPreview.slotIndex === slotIndex) {
    dragGhostEl.classList.toggle("invalid", !valid);
    return;
  }
  state.preview = { row, col, valid, slotIndex };
  syncPreviewCells(previousPreview, state.preview, piece);
  dragGhostEl.classList.toggle("invalid", !valid);
  if (!previousPreview || previousPreview.valid !== valid) {
    renderMessage();
  }
}

function getPreviewCellMap(preview, piece) {
  const map = new Map();
  if (!preview || !preview.valid || !piece) {
    return map;
  }

  const shape = SHAPE_MAP[piece.shapeId];
  for (const [rowOffset, colOffset] of shape.cells) {
    const row = preview.row + rowOffset;
    const col = preview.col + colOffset;
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      continue;
    }
    map.set(row * BOARD_SIZE + col, piece.colorKey);
  }
  return map;
}

function syncPreviewCells(previousPreview, nextPreview, piece) {
  const cells = boardEl.children;
  const previousCells = getPreviewCellMap(previousPreview, piece);
  const nextCells = getPreviewCellMap(nextPreview, piece);

  previousCells.forEach((colorKey, index) => {
    if (nextCells.get(index) === colorKey) {
      nextCells.delete(index);
      return;
    }
    const cellEl = cells[index];
    if (cellEl) {
      cellEl.classList.remove("preview-valid", colorKey);
    }
  });

  nextCells.forEach((colorKey, index) => {
    const cellEl = cells[index];
    if (cellEl) {
      cellEl.classList.add("preview-valid", colorKey);
    }
  });
}

function renderDragGhost(piece) {
  const shape = SHAPE_MAP[piece.shapeId];
  dragGhostEl.innerHTML = "";
  dragGhostEl.className = "drag-ghost active";
  dragGhostEl.style.gridTemplateColumns = `repeat(${shape.width}, auto)`;
  dragGhostEl.style.gridTemplateRows = `repeat(${shape.height}, auto)`;
  for (let row = 0; row < shape.height; row += 1) {
    for (let col = 0; col < shape.width; col += 1) {
      const cell = document.createElement("span");
      const occupied = shape.cells.some(([shapeRow, shapeCol]) => shapeRow === row && shapeCol === col);
      cell.className = occupied ? `slot-cell block ${piece.colorKey}` : "slot-cell";
      cell.style.visibility = occupied ? "visible" : "hidden";
      dragGhostEl.appendChild(cell);
    }
  }
}

function resetDragGhost() {
  dragGhostEl.className = "drag-ghost";
  dragGhostEl.innerHTML = "";
}

function applyClear(rows, cols) {
  const rowSet = new Set(rows);
  const colSet = new Set(cols);
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const cell = state.board[row][col];
      if (!cell) {
        continue;
      }
      if ((rowSet.has(row) || colSet.has(col)) && (cell.type === "block" || cell.type === "target")) {
        state.board[row][col] = null;
      }
    }
  }
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const cell = state.board[row][col];
      if (!cell || cell.type !== "obstacle") {
        continue;
      }
      if (rowSet.has(row) || colSet.has(col)) {
        cell.hp -= 1;
        if (cell.hp <= 0) {
          state.board[row][col] = null;
        }
      }
    }
  }
}

function clearPreview() {
  if (!state.preview || state.dragging) {
    return;
  }
  state.preview = null;
  renderBoard();
  renderMessage();
}

function findCompletedLines(board) {
  const rows = [];
  const cols = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    if (board[row].every((cell) => cell !== null)) {
      rows.push(row);
    }
  }
  for (let col = 0; col < BOARD_SIZE; col += 1) {
    let full = true;
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      if (board[row][col] === null) {
        full = false;
        break;
      }
    }
    if (full) {
      cols.push(col);
    }
  }
  return { rows, cols };
}

function canPlacePiece(board, piece, row, col) {
  const shape = SHAPE_MAP[piece.shapeId];
  for (const [rowOffset, colOffset] of shape.cells) {
    const targetRow = row + rowOffset;
    const targetCol = col + colOffset;
    if (targetRow < 0 || targetRow >= BOARD_SIZE || targetCol < 0 || targetCol >= BOARD_SIZE || board[targetRow][targetCol] !== null) {
      return false;
    }
  }
  return true;
}

function getDragAnchorMetrics(slotIndex, piece, clientX, clientY) {
  const slotEl = trayEls[slotIndex];
  const pieceEl = slotEl?.querySelector(".slot-piece");
  const shape = SHAPE_MAP[piece.shapeId];
  if (!pieceEl || !shape) {
    return { anchorRow: 0, anchorCol: 0, ghostOffsetX: 0, ghostOffsetY: 0 };
  }
  const metrics = getGridMetrics(pieceEl, shape.width, shape.height);
  const localX = clamp(clientX - metrics.rect.left, 0, metrics.rect.width);
  const localY = clamp(clientY - metrics.rect.top, 0, metrics.rect.height);
  const anchorCell = getNearestOccupiedCell(shape, metrics, localX, localY);
  return { anchorRow: anchorCell.row, anchorCol: anchorCell.col, ghostOffsetX: localX, ghostOffsetY: localY };
}

function getBoardCellFromPoint(clientX, clientY) {
  const metrics = getGridMetrics(boardEl, BOARD_SIZE, BOARD_SIZE);
  const { rect, pitchX, pitchY, gapX, gapY } = metrics;
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
    return null;
  }
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  return {
    row: clamp(Math.floor((localY + gapY / 2) / pitchY), 0, BOARD_SIZE - 1),
    col: clamp(Math.floor((localX + gapX / 2) / pitchX), 0, BOARD_SIZE - 1),
  };
}

function getNearestOccupiedCell(shape, metrics, localX, localY) {
  let bestCell = shape.cells[0] ?? [0, 0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const [row, col] of shape.cells) {
    const centerX = col * metrics.pitchX + metrics.cellWidth / 2;
    const centerY = row * metrics.pitchY + metrics.cellHeight / 2;
    const distance = (centerX - localX) ** 2 + (centerY - localY) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestCell = [row, col];
    }
  }
  return { row: bestCell[0], col: bestCell[1] };
}

function getGridMetrics(gridEl, columns, rows) {
  const rect = gridEl.getBoundingClientRect();
  const styles = getComputedStyle(gridEl);
  const gapX = parseFloat(styles.columnGap || styles.gap || "0") || 0;
  const gapY = parseFloat(styles.rowGap || styles.gap || "0") || 0;
  const sampleCell = gridEl.firstElementChild;
  const sampleRect = sampleCell ? sampleCell.getBoundingClientRect() : null;
  const cellWidth = sampleRect?.width || Math.max((rect.width - gapX * (columns - 1)) / columns, 0);
  const cellHeight = sampleRect?.height || Math.max((rect.height - gapY * (rows - 1)) / rows, 0);
  return { rect, gapX, gapY, cellWidth, cellHeight, pitchX: cellWidth + gapX, pitchY: cellHeight + gapY };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function hasAnyLegalMove() {
  return state.slots.some((piece) => piece && pieceCanFitAnywhere(piece));
}

function pieceCanFitAnywhere(piece) {
  const shape = SHAPE_MAP[piece.shapeId];
  for (let row = 0; row <= BOARD_SIZE - shape.height; row += 1) {
    for (let col = 0; col <= BOARD_SIZE - shape.width; col += 1) {
      if (canPlacePiece(state.board, piece, row, col)) {
        return true;
      }
    }
  }
  return false;
}

function shapeCanFitAnywhere(shape) {
  const piece = { shapeId: shape.id };
  for (let row = 0; row <= BOARD_SIZE - shape.height; row += 1) {
    for (let col = 0; col <= BOARD_SIZE - shape.width; col += 1) {
      if (canPlacePiece(state.board, piece, row, col)) {
        return true;
      }
    }
  }
  return false;
}

function countFittableShapes(shapes, stopAt = Number.POSITIVE_INFINITY) {
  let count = 0;
  for (const shape of shapes) {
    if (shapeCanFitAnywhere(shape)) {
      count += 1;
      if (count >= stopAt) {
        return count;
      }
    }
  }
  return count;
}

function getEmptyCellCount(board) {
  let count = 0;
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] === null) {
        count += 1;
      }
    }
  }
  return count;
}

function getPieceRollProfile() {
  const emptyCellCount = getEmptyCellCount(state.board);
  const standardFitCount = countFittableShapes(STANDARD_SHAPES, 6);

  if (emptyCellCount <= 14 || standardFitCount <= 2) {
    return "critical";
  }
  if (emptyCellCount <= 22 || standardFitCount <= 5) {
    return "warning";
  }
  return "normal";
}

function createSnapshot() {
  return {
    mode: state.mode,
    board: cloneBoard(state.board),
    slots: cloneSlots(state.slots),
    score: state.score,
    currentLevel: state.currentLevel,
    targetsTotal: state.targetsTotal,
    totalRowsCleared: state.totalRowsCleared,
    totalColsCleared: state.totalColsCleared,
    comboStreak: state.comboStreak,
    maxCombo: state.maxCombo,
    placementsCount: state.placementsCount,
    endlessWave: state.endlessWave,
    endlessNextSpawnScore: state.endlessNextSpawnScore,
    endlessNextHammerScore: state.endlessNextHammerScore,
    endlessNextUndoScore: state.endlessNextUndoScore,
  };
}

function createSessionPayload() {
  if (state.status !== "playing" && state.status !== "paused") {
    return null;
  }
  return {
    version: SESSION_VERSION,
    pieceIdSeed,
    board: cloneBoard(state.board),
    slots: cloneSlots(state.slots),
    score: state.score,
    currentLevel: state.currentLevel,
    targetsTotal: state.targetsTotal,
    totalRowsCleared: state.totalRowsCleared,
    totalColsCleared: state.totalColsCleared,
    comboStreak: state.comboStreak,
    maxCombo: state.maxCombo,
    undoCount: state.undoCount,
    hammerCount: state.hammerCount,
    placementsCount: state.placementsCount,
    undoSnapshot: cloneSnapshot(state.undoSnapshot),
    elapsedMs: getElapsedMs(),
    updatedAt: Date.now(),
  };
}

function cloneSnapshot(snapshot) {
  if (!snapshot) {
    return null;
  }
  return {
    mode: snapshot.mode,
    board: cloneBoard(snapshot.board),
    slots: cloneSlots(snapshot.slots),
    score: snapshot.score,
    currentLevel: snapshot.currentLevel,
    targetsTotal: snapshot.targetsTotal,
    totalRowsCleared: snapshot.totalRowsCleared,
    totalColsCleared: snapshot.totalColsCleared,
    comboStreak: snapshot.comboStreak,
    maxCombo: snapshot.maxCombo,
    placementsCount: snapshot.placementsCount,
    endlessWave: snapshot.endlessWave ?? 0,
    endlessNextSpawnScore: snapshot.endlessNextSpawnScore ?? 0,
    endlessNextHammerScore: snapshot.endlessNextHammerScore ?? 0,
    endlessNextUndoScore: snapshot.endlessNextUndoScore ?? 0,
  };
}

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function cloneSlots(slots) {
  return slots.map((piece) => (piece ? { ...piece } : null));
}

function createEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => null));
}

function clampLevel(level) {
  return clamp(level, 1, TOTAL_LEVELS);
}

function getLevelTargetCount(level) {
  return clampLevel(level);
}

function countTargets(board) {
  let count = 0;
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col]?.type === "target") {
        count += 1;
      }
    }
  }
  return count;
}

function seedLevelTargets(board, count) {
  const candidates = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (!isCornerCell(row, col) && board[row][col] === null) {
        candidates.push([row, col]);
      }
    }
  }
  for (let placed = 0; placed < count && candidates.length; placed += 1) {
    const index = Math.floor(Math.random() * candidates.length);
    const [row, col] = candidates.splice(index, 1)[0];
    board[row][col] = { type: "target" };
  }
}

function generatePieceSet() {
  const profileName = getPieceRollProfile();
  const pieces = ensurePreferredSpecialPiece(Array.from({ length: 3 }, () => createRandomPiece(profileName)), profileName);
  return ensurePlayablePieceSet(pieces, profileName);
}

function createRandomPiece(profileName = "normal") {
  const shape = pickWeightedShape(profileName);
  return createPieceFromShape(shape);
}

function createPieceFromShape(shape) {
  return { id: (pieceIdSeed += 1), shapeId: shape.id, colorKey: shape.colorKey };
}

function ensurePreferredSpecialPiece(pieces, profileName) {
  if (profileName !== "warning" && profileName !== "critical") {
    return pieces;
  }

  const hasFittableSpecialPiece = pieces.some((piece) => SPECIAL_SHAPE_IDS.has(piece.shapeId) && pieceCanFitAnywhere(piece));
  if (hasFittableSpecialPiece) {
    return pieces;
  }

  const fittingSpecialShapes = SPECIAL_SHAPES.filter((shape) => shapeCanFitAnywhere(shape));
  if (!fittingSpecialShapes.length) {
    return pieces;
  }

  if (profileName === "warning" && Math.random() < 0.35) {
    return pieces;
  }

  const targetIndex = pieces.findIndex((piece) => !SPECIAL_SHAPE_IDS.has(piece.shapeId) || !pieceCanFitAnywhere(piece));
  const nextPieces = pieces.slice();
  const rescueProfileName = profileName === "critical" ? "emergency" : "warning";
  nextPieces[targetIndex >= 0 ? targetIndex : 0] = createPieceFromShape(pickWeightedShape(rescueProfileName, fittingSpecialShapes));
  return nextPieces;
}

function ensurePlayablePieceSet(pieces, profileName) {
  if (pieces.some((piece) => pieceCanFitAnywhere(piece))) {
    return pieces;
  }

  const fittingSpecialShapes = SPECIAL_SHAPES.filter((shape) => shapeCanFitAnywhere(shape));
  if (!fittingSpecialShapes.length) {
    return pieces;
  }

  const rescueProfileName = profileName === "critical" ? "emergency" : "critical";
  const rescueIndex = pieces.findIndex((piece) => !SPECIAL_SHAPE_IDS.has(piece.shapeId));
  const targetIndex = rescueIndex >= 0 ? rescueIndex : 0;
  const nextPieces = pieces.slice();
  nextPieces[targetIndex] = createPieceFromShape(pickWeightedShape(rescueProfileName, fittingSpecialShapes));
  return nextPieces;
}

function pickWeightedShape(profileName, shapePool = SHAPES) {
  const profile = PIECE_ROLL_PROFILES[profileName] || PIECE_ROLL_PROFILES.normal;
  let totalWeight = 0;

  for (const shape of shapePool) {
    totalWeight += getShapeWeight(shape, profile);
  }

  let roll = Math.random() * totalWeight;
  for (const shape of shapePool) {
    roll -= getShapeWeight(shape, profile);
    if (roll <= 0) {
      return shape;
    }
  }

  return shapePool[shapePool.length - 1] || SHAPES[0];
}

function getShapeWeight(shape, profile) {
  if (!SPECIAL_SHAPE_IDS.has(shape.id)) {
    return profile.standard;
  }
  if (shape.id === "mini-single") {
    return profile.single;
  }
  return profile.domino;
}

function getLineScore(count) {
  if (count >= 4) {
    return 1000;
  }
  return SCORE_TABLE[count] || 0;
}

function getElapsedMs() {
  if (state.status === "paused") {
    return state.elapsedAtPause;
  }
  if (state.status === "gameover") {
    return state.elapsedAtGameOver;
  }
  if (state.status !== "playing") {
    return 0;
  }
  return performance.now() - state.sessionStartedAt - state.totalPausedMs;
}

function isCornerCell(row, col) {
  return (
    (row === 0 && col === 0) ||
    (row === 0 && col === BOARD_SIZE - 1) ||
    (row === BOARD_SIZE - 1 && col === 0) ||
    (row === BOARD_SIZE - 1 && col === BOARD_SIZE - 1)
  );
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

async function shareResult() {
  const title = "俄罗斯方块之消除黑快";
  const text = "本局得分 " + state.score + "，行消除 " + state.totalRowsCleared + "，列消除 " + state.totalColsCleared + "，最高连击 " + state.maxCombo + "。";
  const shared = await platformBridge.share({ title, text });
  if (shared) {
    boardMessageEl.textContent = "分享面板已打开。";
  } else if (gameRuntime.isTikTok) {
    boardMessageEl.textContent = "当前环境暂不支持分享。";
  } else {
    boardMessageEl.textContent = "当前浏览器暂不支持原生分享，可直接截图保存。";
  }
}

function render() {
  syncScreenVisibility();
  renderSidebarEntry();
  renderBoard();
  renderTray();
  renderHud();
  renderMessage();
  scheduleResponsiveLayout();
}

function scheduleResponsiveLayout() {
  if (responsiveLayoutFrame) {
    return;
  }
  responsiveLayoutFrame = window.requestAnimationFrame(() => {
    responsiveLayoutFrame = 0;
    applyResponsiveLayout();
  });
}

function applyResponsiveLayout() {
  if (!appShellEl || !gameScreenEl) {
    return;
  }

  const viewportWidth = Math.round(window.visualViewport?.width || window.innerWidth || 0);
  const isMobileViewport = viewportWidth > 0 && viewportWidth <= 540;
  const rootStyle = document.documentElement.style;

  if (!isMobileViewport) {
    rootStyle.removeProperty("--board-size");
    rootStyle.removeProperty("--board-cell");
    rootStyle.removeProperty("--slot-cell-size");
    appShellEl.style.removeProperty("height");
    appShellEl.style.removeProperty("min-height");
    gameScreenEl.style.removeProperty("height");
    gameScreenEl.style.removeProperty("max-height");
    gameScreenEl.style.removeProperty("width");
    return;
  }

  appShellEl.style.removeProperty("height");
  appShellEl.style.removeProperty("min-height");
  gameScreenEl.style.removeProperty("height");
  gameScreenEl.style.removeProperty("max-height");
  gameScreenEl.style.removeProperty("width");

  rootStyle.setProperty("--board-size", `${Math.max(280, Math.min(360, viewportWidth - 28))}px`);
  rootStyle.removeProperty("--board-cell");
  rootStyle.removeProperty("--slot-cell-size");
}

function renderBoard() {
  const cells = boardEl.children;
  const previewMap = getPreviewCells();
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const index = row * BOARD_SIZE + col;
      const cellEl = cells[index];
      const cellData = state.board[row][col];
      const isClearing = state.clearMarks && (state.clearMarks.rows.has(row) || state.clearMarks.cols.has(col));
      const previewColor = previewMap.get(`${row}-${col}`);
      cellEl.className = "cell";
      cellEl.innerHTML = "";
      if (previewColor) {
        cellEl.classList.add("preview-valid", previewColor);
      }
      if (isClearing) {
        cellEl.classList.add("clearing");
      }
      if (!cellData) {
        continue;
      }
      if (cellData.type === "block") {
        const block = document.createElement("span");
        block.className = `block ${cellData.colorKey}`;
        cellEl.appendChild(block);
      } else if (cellData.type === "target") {
        const target = document.createElement("span");
        target.className = "target-block";
        cellEl.appendChild(target);
      } else {
        const obstacle = document.createElement("span");
        obstacle.className = "obstacle";
        obstacle.textContent = String(cellData.hp);
        cellEl.appendChild(obstacle);
      }
    }
  }
}

function renderTray() {
  trayEls.forEach((slotEl, slotIndex) => {
    const piece = state.slots[slotIndex];
    slotEl.classList.toggle("selected", state.selectedSlot === slotIndex);
    slotEl.classList.toggle("drag-source", Boolean(state.dragging && state.dragging.slotIndex === slotIndex));
    slotEl.classList.toggle("empty", !piece);
    slotEl.innerHTML = "";
    if (!piece) {
      const placeholder = document.createElement("span");
      placeholder.className = "slot-placeholder";
      placeholder.textContent = "";
      slotEl.appendChild(placeholder);
      return;
    }
    const shape = SHAPE_MAP[piece.shapeId];
    const pieceGrid = document.createElement("div");
    pieceGrid.className = "slot-piece";
    pieceGrid.style.gridTemplateColumns = `repeat(${shape.width}, auto)`;
    pieceGrid.style.gridTemplateRows = `repeat(${shape.height}, auto)`;
    for (let row = 0; row < shape.height; row += 1) {
      for (let col = 0; col < shape.width; col += 1) {
        const cell = document.createElement("span");
        const occupied = shape.cells.some(([shapeRow, shapeCol]) => shapeRow === row && shapeCol === col);
        cell.className = occupied ? `slot-cell block ${piece.colorKey}` : "slot-cell";
        cell.style.visibility = occupied ? "visible" : "hidden";
        pieceGrid.appendChild(cell);
      }
    }
    slotEl.appendChild(pieceGrid);
  });
}

// LEGACY_DUPLICATE_STUB
function renderHud() {}

function renderMessage() {}

function getPreviewCells() {
  const map = new Map();
  if (!state.preview || !state.preview.valid || state.selectedSlot === null) {
    return map;
  }
  const piece = state.slots[state.selectedSlot];
  if (!piece) {
    return map;
  }
  const shape = SHAPE_MAP[piece.shapeId];
  for (const [rowOffset, colOffset] of shape.cells) {
    map.set(`${state.preview.row + rowOffset}-${state.preview.col + colOffset}`, piece.colorKey);
  }
  return map;
}

function hideAllOverlays() {
  pauseOverlayEl.classList.remove("active");
  gameOverOverlayEl.classList.remove("active");
}

function startUiLoop() {
  const tick = () => {
    animateScoreValue();
    updateTimer();
    uiAnimationFrame = window.requestAnimationFrame(tick);
  };
  if (!uiAnimationFrame) {
    uiAnimationFrame = window.requestAnimationFrame(tick);
  }
}

function animateScoreValue() {
  if (state.displayedScore === state.score && !scoreTween) {
    scoreValueEl.textContent = String(state.displayedScore);
    return;
  }
  if (!scoreTween || scoreTween.to !== state.score) {
    scoreTween = { from: state.displayedScore, to: state.score, startedAt: performance.now(), duration: 500 };
  }
  const elapsed = performance.now() - scoreTween.startedAt;
  const progress = Math.min(1, elapsed / scoreTween.duration);
  const eased = 1 - (1 - progress) ** 3;
  state.displayedScore = Math.round(scoreTween.from + (scoreTween.to - scoreTween.from) * eased);
  if (progress >= 1) {
    state.displayedScore = state.score;
    scoreTween = null;
  }
  scoreValueEl.textContent = String(state.displayedScore);
}

function updateTimer() {
  timeValueEl.textContent = formatTime(getElapsedMs());
}

function formatTime(elapsedMs) {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function loadProfile() {
  const stored = readStorage(STORAGE_KEYS.profile);
  return { ...DEFAULT_PROFILE, ...(stored && typeof stored === "object" ? stored : {}) };
}

function saveProfile(nextProfile) {
  writeStorage(STORAGE_KEYS.profile, nextProfile);
}

function loadSession() {
  const session = readStorage(STORAGE_KEYS.session);
  if (!session || session.version !== SESSION_VERSION) {
    return null;
  }
  return session;
}

function persistSession() {
  const payload = createSessionPayload();
  if (!payload) {
    return;
  }
  writeStorage(STORAGE_KEYS.session, payload);
  refreshResumeState();
}

function clearSavedSession() {
  removeStorage(STORAGE_KEYS.session);
}

function refreshResumeState() {
  continueButton.hidden = !loadSession();
}

function readStorage(key) {
  if (typeof gameRuntime.readStorage !== "function") {
    return null;
  }
  return gameRuntime.readStorage(key);
}

function writeStorage(key, value) {
  if (typeof gameRuntime.writeStorage !== "function") {
    return;
  }
  gameRuntime.writeStorage(key, value);
}

function removeStorage(key) {
  if (typeof gameRuntime.removeStorage !== "function") {
    return;
  }
  gameRuntime.removeStorage(key);
}

const DRAG_PREVIEW_LIFT = 10;
const DRAG_SNAP_PADDING_RATIO = 0.34;
const DRAG_PREVIEW_LEASH_LEFT_RATIO = 0.24;
const DRAG_PREVIEW_LEASH_RIGHT_RATIO = 0.58;
const DRAG_PREVIEW_LEASH_Y_RATIO = 0.28;
const DRAG_PREVIEW_LOCK_RATIO = 0.38;
let dragGhostFrame = 0;

function beginDrag(slotIndex, pointerId, clientX, clientY) {
  const piece = state.slots[slotIndex];
  if (!piece) {
    return;
  }
  state.dragging = {
    slotIndex,
    pointerId,
    pointerX: clientX,
    pointerY: clientY,
    appliedX: Number.NaN,
    appliedY: Number.NaN,
    ...getDragAnchorMetrics(slotIndex, piece, clientX, clientY),
  };
  state.selectedSlot = slotIndex;
  state.hammerMode = false;
  playDragSound(piece);
  renderDragGhost(piece);
  flushDragUpdate();
  renderTray();
  renderMessage();
}

function handleGlobalPointerMove(event) {
  updateActiveDrag(event.pointerId, event.clientX, event.clientY);
}

function queueDragUpdate(clientX, clientY) {
  const dragging = state.dragging;
  if (!dragging) {
    return;
  }

  dragging.pointerX = clientX;
  dragging.pointerY = clientY;

  if (dragGhostFrame) {
    return;
  }

  dragGhostFrame = window.requestAnimationFrame(() => {
    dragGhostFrame = 0;
    applyDragUpdate();
  });
}

function flushDragUpdate() {
  if (dragGhostFrame) {
    window.cancelAnimationFrame(dragGhostFrame);
    dragGhostFrame = 0;
  }
  applyDragUpdate();
}

function applyDragUpdate() {
  const dragging = state.dragging;
  if (!dragging) {
    return;
  }

  const clientX = dragging.pointerX;
  const clientY = dragging.pointerY;
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
    return;
  }
  if (dragging.appliedX === clientX && dragging.appliedY === clientY) {
    return;
  }

  dragging.appliedX = clientX;
  dragging.appliedY = clientY;
  updatePreviewFromPoint(clientX, clientY, dragging.slotIndex);
  updateDragPosition(clientX, clientY);
}

function updateDragPosition(clientX, clientY) {
  const dragging = state.dragging;
  if (!dragging) {
    return;
  }
  const boardMetrics = dragging.boardMetrics;

  const freeLeft = clientX - dragging.ghostOffsetX;
  const freeTop = clientY - dragging.ghostOffsetY;
  let left = freeLeft;
  let top = freeTop;

  if (boardMetrics && state.preview && state.preview.slotIndex === dragging.slotIndex && state.preview.valid) {
    const snapLeft = boardMetrics.rect.left + state.preview.col * boardMetrics.pitchX;
    const snapTop = boardMetrics.rect.top + state.preview.row * boardMetrics.pitchY - DRAG_PREVIEW_LIFT;
    const leashLeft = Math.max(boardMetrics.cellWidth * DRAG_PREVIEW_LEASH_LEFT_RATIO, 7);
    const leashRight = Math.max(boardMetrics.cellWidth * DRAG_PREVIEW_LEASH_RIGHT_RATIO, 12);
    const leashY = Math.max(boardMetrics.cellHeight * DRAG_PREVIEW_LEASH_Y_RATIO, 7);
    left = clamp(freeLeft, snapLeft - leashLeft, snapLeft + leashRight);
    top = clamp(freeTop, snapTop - leashY, snapTop + leashY);
  }

  dragging.renderLeft = left;
  dragging.renderTop = top;
  dragGhostEl.style.transform = `translate3d(${dragging.renderLeft}px, ${dragging.renderTop}px, 0)`;
}

function updatePreviewFromPoint(clientX, clientY, slotIndex) {
  const piece = state.slots[slotIndex];
  if (!piece || !state.dragging || state.dragging.slotIndex !== slotIndex) {
    return;
  }

  const placement = getBoardPlacementFromGhost(clientX, clientY, piece, state.dragging);
  if (!placement) {
    if (state.preview) {
      const previousPreview = state.preview;
      state.preview = null;
      syncPreviewCells(previousPreview, null, piece);
      if (previousPreview.valid) {
        renderMessage();
      }
    }
    dragGhostEl.classList.add("invalid");
    return;
  }

  updatePreview(placement.row, placement.col, slotIndex, piece);
}

function renderDragGhost(piece) {
  const shape = SHAPE_MAP[piece.shapeId];
  const boardMetrics = state.dragging?.boardMetrics || getGridMetrics(boardEl, BOARD_SIZE, BOARD_SIZE);
  const cellRadius = getComputedStyle(document.documentElement).getPropertyValue("--cell-radius").trim() || "7px";

  dragGhostEl.innerHTML = "";
  dragGhostEl.className = "drag-ghost active";
  dragGhostEl.style.columnGap = `${boardMetrics.gapX}px`;
  dragGhostEl.style.rowGap = `${boardMetrics.gapY}px`;
  dragGhostEl.style.gridTemplateColumns = `repeat(${shape.width}, ${boardMetrics.cellWidth}px)`;
  dragGhostEl.style.gridTemplateRows = `repeat(${shape.height}, ${boardMetrics.cellHeight}px)`;

  for (let row = 0; row < shape.height; row += 1) {
    for (let col = 0; col < shape.width; col += 1) {
      const cell = document.createElement("span");
      const occupied = shape.cells.some(([shapeRow, shapeCol]) => shapeRow === row && shapeCol === col);
      cell.className = occupied ? `slot-cell block ${piece.colorKey}` : "slot-cell";
      cell.style.width = `${boardMetrics.cellWidth}px`;
      cell.style.height = `${boardMetrics.cellHeight}px`;
      cell.style.borderRadius = cellRadius;
      cell.style.visibility = occupied ? "visible" : "hidden";
      dragGhostEl.appendChild(cell);
    }
  }
}

function resetDragGhost() {
  activeTouchId = null;
  if (dragGhostFrame) {
    window.cancelAnimationFrame(dragGhostFrame);
    dragGhostFrame = 0;
  }
  dragGhostEl.className = "drag-ghost";
  dragGhostEl.innerHTML = "";
  dragGhostEl.style.transform = "translate3d(0px, 0px, 0)";
  dragGhostEl.style.columnGap = "";
  dragGhostEl.style.rowGap = "";
  dragGhostEl.style.gridTemplateColumns = "";
  dragGhostEl.style.gridTemplateRows = "";
}

function getDragAnchorMetrics(slotIndex, piece, clientX, clientY) {
  const slotEl = trayEls[slotIndex];
  const pieceEl = slotEl?.querySelector(".slot-piece");
  const shape = SHAPE_MAP[piece.shapeId];
  const boardMetrics = getGridMetrics(boardEl, BOARD_SIZE, BOARD_SIZE);
  const ghostWidth = shape.width * boardMetrics.cellWidth + Math.max(0, shape.width - 1) * boardMetrics.gapX;
  const ghostHeight = shape.height * boardMetrics.cellHeight + Math.max(0, shape.height - 1) * boardMetrics.gapY;

  if (!pieceEl || !shape) {
    return {
      anchorRow: 0,
      anchorCol: 0,
      ghostOffsetX: ghostWidth / 2,
      ghostOffsetY: ghostHeight / 2,
      ghostWidth,
      ghostHeight,
      boardMetrics,
    };
  }

  const trayMetrics = getGridMetrics(pieceEl, shape.width, shape.height);
  const localX = clamp(clientX - trayMetrics.rect.left, 0, trayMetrics.rect.width);
  const localY = clamp(clientY - trayMetrics.rect.top, 0, trayMetrics.rect.height);
  const anchorCell = getNearestOccupiedCell(shape, trayMetrics, localX, localY);
  const scaleX = trayMetrics.rect.width > 0 ? ghostWidth / trayMetrics.rect.width : 1;
  const scaleY = trayMetrics.rect.height > 0 ? ghostHeight / trayMetrics.rect.height : 1;

  return {
    anchorRow: anchorCell.row,
    anchorCol: anchorCell.col,
    ghostOffsetX: localX * scaleX,
    ghostOffsetY: localY * scaleY,
    ghostWidth,
    ghostHeight,
    boardMetrics,
  };
}

function getBoardPlacementFromGhost(clientX, clientY, piece, dragging) {
  const boardMetrics = dragging.boardMetrics || getGridMetrics(boardEl, BOARD_SIZE, BOARD_SIZE);
  const lockedPlacement = getLockedPreviewPlacement(clientX, clientY, dragging, boardMetrics);
  if (lockedPlacement) {
    return lockedPlacement;
  }
  const snapPaddingX = boardMetrics.cellWidth * DRAG_SNAP_PADDING_RATIO;
  const snapPaddingY = boardMetrics.cellHeight * DRAG_SNAP_PADDING_RATIO;
  if (
    clientX < boardMetrics.rect.left - snapPaddingX ||
    clientX > boardMetrics.rect.right + snapPaddingX ||
    clientY < boardMetrics.rect.top - snapPaddingY ||
    clientY > boardMetrics.rect.bottom + snapPaddingY
  ) {
    return null;
  }
  const localX = clamp(clientX - boardMetrics.rect.left, 0, Math.max(boardMetrics.rect.width - 1, 0));
  const localY = clamp(clientY - boardMetrics.rect.top, 0, Math.max(boardMetrics.rect.height - 1, 0));
  const anchorBoardRow = clamp(Math.floor((localY + boardMetrics.gapY / 2) / boardMetrics.pitchY), 0, BOARD_SIZE - 1);
  const anchorBoardCol = clamp(Math.floor((localX + boardMetrics.gapX / 2) / boardMetrics.pitchX), 0, BOARD_SIZE - 1);

  return {
    row: anchorBoardRow - (dragging.anchorRow || 0),
    col: anchorBoardCol - (dragging.anchorCol || 0),
  };
}

function getLockedPreviewPlacement(clientX, clientY, dragging, boardMetrics) {
  const preview = state.preview;
  if (!preview || !preview.valid || preview.slotIndex !== dragging.slotIndex) {
    return null;
  }

  const anchorRow = preview.row + (dragging.anchorRow || 0);
  const anchorCol = preview.col + (dragging.anchorCol || 0);
  const anchorCenterX = boardMetrics.rect.left + anchorCol * boardMetrics.pitchX + boardMetrics.cellWidth / 2;
  const anchorCenterY = boardMetrics.rect.top + anchorRow * boardMetrics.pitchY + boardMetrics.cellHeight / 2;
  const lockX = Math.max(boardMetrics.cellWidth * DRAG_PREVIEW_LOCK_RATIO, 10);
  const lockY = Math.max(boardMetrics.cellHeight * DRAG_PREVIEW_LOCK_RATIO, 10);

  if (Math.abs(clientX - anchorCenterX) <= lockX && Math.abs(clientY - anchorCenterY) <= lockY) {
    return { row: preview.row, col: preview.col };
  }

  return null;
}

// LEGACY_DUPLICATE_STUB
function beginLevel(level) {}

function renderHud() {}

function renderMessage() {}

function hideAllOverlays() {
  pauseOverlayEl.classList.remove("active");
  levelCompleteOverlayEl.classList.remove("active");
  gameOverOverlayEl.classList.remove("active");
  sidebarRewardOverlayEl.classList.remove("active");
}

function syncScreenVisibility() {
  const isHome = state.status === "home";
  if (startScreenEl) {
    startScreenEl.classList.toggle("active", isHome);
  }
  if (gameScreenEl) {
    gameScreenEl.classList.toggle("game-screen-hidden", isHome);
  }
  if (appShellEl) {
    appShellEl.classList.toggle("home-mode", isHome);
    appShellEl.classList.toggle("play-mode", !isHome);
  }
}

function getElapsedMs() {
  if (state.status === "paused" || state.status === "levelcomplete") {
    return state.elapsedAtPause;
  }
  if (state.status === "gameover") {
    return state.elapsedAtGameOver;
  }
  if (state.status !== "playing") {
    return 0;
  }
  return performance.now() - state.sessionStartedAt - state.totalPausedMs;
}

function createSessionPayload() {
  if (!["playing", "paused", "levelcomplete"].includes(state.status)) {
    return null;
  }
  return {
    version: SESSION_VERSION,
    status: state.status,
    mode: state.mode,
    pieceIdSeed,
    board: cloneBoard(state.board),
    slots: cloneSlots(state.slots),
    score: state.score,
    currentLevel: state.currentLevel,
    targetsTotal: state.targetsTotal,
    totalRowsCleared: state.totalRowsCleared,
    totalColsCleared: state.totalColsCleared,
    comboStreak: state.comboStreak,
    maxCombo: state.maxCombo,
    undoCount: state.undoCount,
    hammerCount: state.hammerCount,
    placementsCount: state.placementsCount,
    undoSnapshot: cloneSnapshot(state.undoSnapshot),
    pendingNextLevel: state.pendingNextLevel,
    endlessWave: state.endlessWave,
    endlessNextSpawnScore: state.endlessNextSpawnScore,
    endlessNextHammerScore: state.endlessNextHammerScore,
    endlessNextUndoScore: state.endlessNextUndoScore,
    elapsedMs: getElapsedMs(),
    updatedAt: Date.now(),
  };
}

// LEGACY_DUPLICATE_STUB
function refreshResumeState() {}

function endGame(reason = "failed") {}

// FINAL_LEVEL_SYSTEM_OVERRIDE
function getLevelConfig(level) {
  return LEVEL_CONFIGS[clampLevel(level) - 1] || LEVEL_CONFIGS[0];
}

function getLevelTargetCount(level) {
  return getLevelConfig(level).durabilityBudget;
}

function countTargets(board) {
  let count = 0;
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col]?.type === "target") {
        count += board[row][col].hp || 1;
      }
    }
  }
  return count;
}

function seedLevelTargets(board) {
  const config = getLevelConfig(state.currentLevel);
  let groups = [];
  let placements = [];

  try {
    groups = buildLevelGroups(config);
    placements = placeTargetGroups(board, groups);
  } catch {
    const fallbackConfig = { ...config, allowedShapes: ["single", "domino", "triLine"], maxHp: Math.min(config.maxHp, 2) };
    groups = buildLevelGroups(fallbackConfig);
    placements = placeTargetGroups(board, groups);
  }

  for (const placement of placements) {
    for (const [row, col] of placement.cells) {
      board[row][col] = { type: "target", hp: placement.hp, maxHp: placement.hp };
    }
  }
}

function buildLevelGroups(config) {
  const shapes = chooseGroupShapes(config.targetCells, config.allowedShapes);
  const hpValues = assignGroupHp(shapes, config.durabilityBudget - config.targetCells, config.maxHp);
  return shapes.map((shapeId, index) => ({ shapeId, hp: hpValues[index] }));
}

function chooseGroupShapes(targetCells, allowedShapes) {
  const result = fillShapeCells(targetCells, allowedShapes, []);
  if (!result) {
    throw new Error(`Unable to build target groups for ${targetCells} cells.`);
  }
  return result;
}

function fillShapeCells(remainingCells, allowedShapes, picked) {
  if (remainingCells === 0) {
    return picked;
  }

  const candidates = shuffleArray(
    allowedShapes.filter((shapeId) => TARGET_SHAPE_LIBRARY[shapeId].cells.length <= remainingCells)
  );

  for (const shapeId of candidates) {
    const next = fillShapeCells(remainingCells - TARGET_SHAPE_LIBRARY[shapeId].cells.length, allowedShapes, [...picked, shapeId]);
    if (next) {
      return next;
    }
  }

  return null;
}

function assignGroupHp(shapeIds, extraDurability, maxHp) {
  const result = fillGroupHp(shapeIds, extraDurability, maxHp, 0, []);
  if (!result) {
    throw new Error(`Unable to assign target hp for extra durability ${extraDurability}.`);
  }
  return result.map((extra) => extra + 1);
}

function fillGroupHp(shapeIds, remainingExtra, maxHp, index, picked) {
  if (index >= shapeIds.length) {
    return remainingExtra === 0 ? picked : null;
  }

  const shapeSize = TARGET_SHAPE_LIBRARY[shapeIds[index]].cells.length;
  const maxExtraSteps = Math.min(maxHp - 1, Math.floor(remainingExtra / shapeSize));
  const candidates = shuffleArray(Array.from({ length: maxExtraSteps + 1 }, (_, value) => value));

  for (const extraStep of candidates) {
    const next = fillGroupHp(shapeIds, remainingExtra - extraStep * shapeSize, maxHp, index + 1, [...picked, extraStep]);
    if (next) {
      return next;
    }
  }

  return null;
}

function placeTargetGroups(board, groups) {
  const orderedGroups = [...groups].sort(
    (left, right) => TARGET_SHAPE_LIBRARY[right.shapeId].cells.length - TARGET_SHAPE_LIBRARY[left.shapeId].cells.length
  );

  for (const spacing of [1, 0]) {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const workingBoard = cloneBoard(board);
      const placements = [];
      let failed = false;

      for (const group of orderedGroups) {
        const placement = findRandomPlacement(workingBoard, group, spacing);
        if (!placement) {
          failed = true;
          break;
        }
        stampTargetGroup(workingBoard, placement.cells, group.hp);
        placements.push(placement);
      }

      if (!failed) {
        return placements;
      }
    }
  }

  throw new Error(`Unable to place target groups for level ${state.currentLevel}.`);
}

function findRandomPlacement(board, group, spacing) {
  const candidates = [];
  for (const variant of getTargetShapeVariants(group.shapeId)) {
    for (let row = 0; row <= BOARD_SIZE - variant.height; row += 1) {
      for (let col = 0; col <= BOARD_SIZE - variant.width; col += 1) {
        const absoluteCells = variant.cells.map(([cellRow, cellCol]) => [row + cellRow, col + cellCol]);
        if (canPlaceTargetGroup(board, absoluteCells, spacing)) {
          candidates.push({ hp: group.hp, cells: absoluteCells });
        }
      }
    }
  }

  if (!candidates.length) {
    return null;
  }

  return randomChoice(candidates);
}

function canPlaceTargetGroup(board, cells, spacing) {
  for (const [row, col] of cells) {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      return false;
    }
    if (isCornerCell(row, col) || board[row][col] !== null) {
      return false;
    }

    for (let deltaRow = -spacing; deltaRow <= spacing; deltaRow += 1) {
      for (let deltaCol = -spacing; deltaCol <= spacing; deltaCol += 1) {
        const nextRow = row + deltaRow;
        const nextCol = col + deltaCol;
        if (nextRow < 0 || nextRow >= BOARD_SIZE || nextCol < 0 || nextCol >= BOARD_SIZE) {
          continue;
        }
        if (board[nextRow][nextCol]?.type === "target") {
          return false;
        }
      }
    }
  }
  return true;
}

function stampTargetGroup(board, cells, hp) {
  for (const [row, col] of cells) {
    board[row][col] = { type: "target", hp, maxHp: hp };
  }
}

function getTargetShapeVariants(shapeId) {
  const baseShape = TARGET_SHAPE_LIBRARY[shapeId];
  const variants = [];
  let current = baseShape.cells;

  for (let rotation = 0; rotation < 4; rotation += 1) {
    const normalized = normalizeCells(current);
    const signature = getCellsSignature(normalized);
    if (!variants.some((variant) => variant.signature === signature)) {
      const maxRow = Math.max(...normalized.map(([row]) => row));
      const maxCol = Math.max(...normalized.map(([, col]) => col));
      variants.push({
        signature,
        width: maxCol + 1,
        height: maxRow + 1,
        cells: normalized,
      });
    }
    current = rotateCellsClockwise(current);
  }

  return variants;
}

function rotateCellsClockwise(cells) {
  const maxRow = Math.max(...cells.map(([row]) => row));
  return cells.map(([row, col]) => [col, maxRow - row]);
}

function normalizeCells(cells) {
  const minRow = Math.min(...cells.map(([row]) => row));
  const minCol = Math.min(...cells.map(([, col]) => col));
  return cells
    .map(([row, col]) => [row - minRow, col - minCol])
    .sort((left, right) => left[0] - right[0] || left[1] - right[1]);
}

function getCellsSignature(cells) {
  return cells.map(([row, col]) => `${row}:${col}`).join("|");
}

function shuffleArray(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function applyClear(rows, cols) {
  const rowSet = new Set(rows);
  const colSet = new Set(cols);
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const cell = state.board[row][col];
      if (!cell || !(rowSet.has(row) || colSet.has(col))) {
        continue;
      }
      if (cell.type === "block") {
        state.board[row][col] = null;
      } else if (cell.type === "target") {
        const damage = state.mode === "endless" && rowSet.has(row) && colSet.has(col) ? 2 : 1;
        cell.hp -= damage;
        if (cell.hp <= 0) {
          state.board[row][col] = null;
        }
      }
    }
  }

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const cell = state.board[row][col];
      if (!cell || cell.type !== "obstacle") {
        continue;
      }
      if (rowSet.has(row) || colSet.has(col)) {
        cell.hp -= 1;
        if (cell.hp <= 0) {
          state.board[row][col] = null;
        }
      }
    }
  }
}

function useHammer(row, col) {
  const cell = state.board[row][col];
  if (!cell) {
    platformBridge.haptic("warning");
    renderMessage();
    return;
  }

  if (cell.type === "target") {
    cell.hp -= 1;
    if (cell.hp <= 0) {
      state.board[row][col] = null;
    }
  } else {
    state.board[row][col] = null;
  }

  state.hammerCount -= 1;
  state.hammerMode = false;
  state.undoSnapshot = null;
  state.targetsRemaining = countTargets(state.board);
  platformBridge.haptic("success");
  if (maybeAdvanceLevel()) {
    return;
  }
  persistSession();
  render();
}

function beginLevel(level) {
  const nextLevel = clampLevel(level);
  const config = getLevelConfig(nextLevel);

  clearNotice();
  state.currentLevel = nextLevel;
  state.targetsTotal = config.durabilityBudget;
  state.board = createEmptyBoard();
  seedLevelTargets(state.board);
  state.targetsRemaining = countTargets(state.board);
  state.slots = generatePieceSet();
  state.selectedSlot = null;
  state.pendingDrag = null;
  state.dragging = null;
  state.suppressBoardClick = false;
  state.hammerMode = false;
  state.placementsCount = 0;
  state.undoSnapshot = null;
  state.preview = null;
  state.clearMarks = null;
  state.isResolving = false;
  state.pendingNextLevel = null;
  resetDragGhost();
  showNotice(`�� ${state.currentLevel} �أ�${config.targetCells} ��Ŀ�꣬���;� ${config.durabilityBudget}`);
}

function renderBoard() {
  const cells = boardEl.children;
  const previewMap = getPreviewCells();

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const index = row * BOARD_SIZE + col;
      const cellEl = cells[index];
      const cellData = state.board[row][col];
      const isClearing = state.clearMarks && (state.clearMarks.rows.has(row) || state.clearMarks.cols.has(col));
      const previewColor = previewMap.get(`${row}-${col}`);

      cellEl.className = "cell";
      cellEl.innerHTML = "";

      if (previewColor) {
        cellEl.classList.add("preview-valid", previewColor);
      }
      if (isClearing) {
        cellEl.classList.add("clearing");
      }
      if (!cellData) {
        continue;
      }

      if (cellData.type === "block") {
        const block = document.createElement("span");
        block.className = `block ${cellData.colorKey}`;
        cellEl.appendChild(block);
      } else if (cellData.type === "target") {
        const target = document.createElement("span");
        target.className = `target-block hp-${Math.min(4, Math.max(1, cellData.hp || 1))}`;
        target.textContent = String(cellData.hp || 1);
        cellEl.appendChild(target);
      } else {
        const obstacle = document.createElement("span");
        obstacle.className = "obstacle";
        obstacle.textContent = String(cellData.hp);
        cellEl.appendChild(obstacle);
      }
    }
  }
}

function renderHud() {
  rowsClearedValueEl.textContent = String(state.totalRowsCleared);
  colsClearedValueEl.textContent = String(state.totalColsCleared);
  maxComboValueEl.textContent = String(state.maxCombo);
  undoCountValueEl.textContent = String(state.undoCount);
  hammerCountValueEl.textContent = String(state.hammerCount);
  comboBadgeEl.textContent = `���� ${state.comboStreak}`;
  bestScoreValueEl.textContent = String(profile.bestScore || 0);
  phaseValueEl.textContent =
    state.status === "home" ? `�ؿ���ҳ 1-${TOTAL_LEVELS}` : `�� ${state.currentLevel} / ${TOTAL_LEVELS} ��`;
  targetValueEl.textContent = state.status === "home" ? "Ŀ�� 0/0" : `Ŀ�� ${state.targetsRemaining}/${state.targetsTotal}`;
  pauseButton.disabled = state.status !== "playing" || state.isResolving;
  undoButton.disabled = !(state.status === "playing" && !state.isResolving && state.undoCount > 0 && state.undoSnapshot);
  hammerButton.disabled = !(state.status === "playing" && !state.isResolving && state.hammerCount > 0);
  hammerButton.classList.toggle("active", state.hammerMode);
}

function renderMessage() {
  if (state.status === "home") {
    boardMessageEl.textContent = "��ҳ��ѡ������ѽ����ؿ�����ӵ�һ�����¿�ʼ��";
    return;
  }
  if (state.status === "paused") {
    boardMessageEl.textContent = "��Ϸ����ͣ����ǰ�����ѱ����";
    return;
  }
  if (state.status === "levelcomplete") {
    boardMessageEl.textContent = "��������ɣ���ѡ���Ƿ������һ�ء�";
    return;
  }
  if (state.status === "gameover") {
    boardMessageEl.textContent = state.endReason === "cleared" ? `${TOTAL_LEVELS} ����ȫ��ͨ�ء�` : "�Ѿ�û���κκϷ���㡣";
    return;
  }
  if (state.isResolving) {
    boardMessageEl.textContent = "���ڽ��㱾������...";
    return;
  }
  if (state.dragging) {
    boardMessageEl.textContent = state.preview && state.preview.valid
      ? "���ּ��ɷ��µ�ǰ���顣"
      : "�ϵ����̿�λ�ϣ�Ŀ�������з��鶼���ܸ��ǡ�";
    return;
  }
  if (state.hammerMode) {
    boardMessageEl.textContent = "����ģʽ�����Ŀ������� 1 ���;ã�����ʿ��ֱ�������";
    return;
  }
  if (state.notice) {
    boardMessageEl.textContent = state.notice;
    return;
  }
  if (state.selectedSlot === null) {
    boardMessageEl.textContent = "���ȫ��Ŀ���;ü��ɹ��أ��ӵײ��϶����鵽���̿�ʼ���֡�";
    return;
  }
  if (state.preview && state.preview.valid) {
    boardMessageEl.textContent = "��ǰλ�úϷ���������ɷ��á�";
    return;
  }
  boardMessageEl.textContent = "�ƶ������̿ɲ鿴Ԥ�����Ƿ�λ�ò�����ʾ��㡣";
}

function refreshResumeState() {
  const session = loadSession();
  const unlockedLevel = getUnlockedLevel();
  const sessionLevel = session?.pendingNextLevel || session?.currentLevel || unlockedLevel;
  const canContinue = Boolean(session) || unlockedLevel > 1;

  continueButton.disabled = !canContinue;

  if (session) {
    continueButton.textContent = `������ ${sessionLevel} ��`;
    continueHintEl.textContent =
      session.status === "levelcomplete" && session.pendingNextLevel
        ? `��һ������ɣ���ֱ�ӽ���� ${session.pendingNextLevel} �ء�`
        : `��⵽δ��ɽ��ȣ��������� ${sessionLevel} �ء�`;
    return;
  }

  if (unlockedLevel > 1) {
    continueButton.textContent = `������ ${unlockedLevel} ��`;
    continueHintEl.textContent = `��ǰ�ѽ������� ${unlockedLevel} �ء�`;
    return;
  }

  continueButton.textContent = "�����ؿ�";
  continueHintEl.textContent = "��ǰ��û�пɼ����Ĺؿ�����ӵ�һ�ؿ�ʼ��";
}

function endGame(reason = "failed") {
  state.elapsedAtGameOver = getElapsedMs();
  state.status = "gameover";
  state.selectedSlot = null;
  state.pendingDrag = null;
  state.dragging = null;
  state.hammerMode = false;
  state.preview = null;
  state.pendingNextLevel = null;
  state.endReason = reason;
  clearNotice();
  updateProfileAfterGame();
  resetDragGhost();
  hideAllOverlays();
  finalScoreValueEl.textContent = String(state.score);
  finalBestValueEl.textContent = String(profile.bestScore);
  finalRowsValueEl.textContent = String(state.totalRowsCleared);
  finalColsValueEl.textContent = String(state.totalColsCleared);
  finalComboValueEl.textContent = String(state.maxCombo);
  resultEyebrowEl.textContent = reason === "cleared" ? "Completed" : "Game Over";
  resultTitleEl.textContent = reason === "cleared" ? `����� ${TOTAL_LEVELS} ��` : "���ֽ���";
  restartButton.textContent = reason === "cleared" ? "���´���" : "����һ��";
  gameOverOverlayEl.classList.add("active");
  clearSavedSession();
  refreshResumeState();
  platformBridge.haptic(reason === "cleared" ? "success" : "warning");
  render();
}

// FINAL_TARGET_SYSTEM_OVERRIDE
LEVEL_CONFIGS.splice(
  0,
  LEVEL_CONFIGS.length,
  { targetCells: 3, durabilityBudget: 3, allowedShapes: ["single"], maxHp: 1, minGroups: 3, maxGroups: 3, maxLargeGroups: 0, maxHighHpGroups: 0, easyGroupTarget: 3, maxCenterCells: 1 },
  { targetCells: 4, durabilityBudget: 4, allowedShapes: ["single"], maxHp: 1, minGroups: 4, maxGroups: 4, maxLargeGroups: 0, maxHighHpGroups: 0, easyGroupTarget: 3, maxCenterCells: 1 },
  { targetCells: 5, durabilityBudget: 5, allowedShapes: ["single", "domino"], maxHp: 1, minGroups: 3, maxGroups: 4, maxLargeGroups: 0, maxHighHpGroups: 0, easyGroupTarget: 3, maxCenterCells: 2 },
  { targetCells: 6, durabilityBudget: 6, allowedShapes: ["single", "domino"], maxHp: 1, minGroups: 3, maxGroups: 4, maxLargeGroups: 0, maxHighHpGroups: 0, easyGroupTarget: 3, maxCenterCells: 2 },
  { targetCells: 6, durabilityBudget: 7, allowedShapes: ["domino", "triLine", "triL"], maxHp: 2, minGroups: 2, maxGroups: 3, maxLargeGroups: 0, maxHighHpGroups: 0, easyGroupTarget: 2, maxCenterCells: 2 },
  { targetCells: 7, durabilityBudget: 8, allowedShapes: ["domino", "triLine", "triL"], maxHp: 2, minGroups: 2, maxGroups: 3, maxLargeGroups: 0, maxHighHpGroups: 0, easyGroupTarget: 2, maxCenterCells: 2 },
  { targetCells: 8, durabilityBudget: 8, allowedShapes: ["domino", "triLine", "triL"], maxHp: 1, minGroups: 3, maxGroups: 4, maxLargeGroups: 0, maxHighHpGroups: 0, easyGroupTarget: 3, maxCenterCells: 3 },
  { targetCells: 8, durabilityBudget: 10, allowedShapes: ["domino", "triLine", "triL"], maxHp: 2, minGroups: 2, maxGroups: 3, maxLargeGroups: 0, maxHighHpGroups: 0, easyGroupTarget: 2, maxCenterCells: 3 },
  { targetCells: 9, durabilityBudget: 11, allowedShapes: ["triLine", "triL", "line4", "square"], maxHp: 2, minGroups: 2, maxGroups: 3, maxLargeGroups: 1, maxHighHpGroups: 0, easyGroupTarget: 2, maxCenterCells: 3 },
  { targetCells: 9, durabilityBudget: 12, allowedShapes: ["triLine", "triL", "line4", "square", "l4", "t4"], maxHp: 2, minGroups: 2, maxGroups: 3, maxLargeGroups: 1, maxHighHpGroups: 0, easyGroupTarget: 2, maxCenterCells: 3 },
  { targetCells: 10, durabilityBudget: 13, allowedShapes: ["triLine", "triL", "line4", "square", "l4"], maxHp: 2, minGroups: 3, maxGroups: 4, maxLargeGroups: 1, maxHighHpGroups: 0, easyGroupTarget: 2, maxCenterCells: 3 },
  { targetCells: 10, durabilityBudget: 15, allowedShapes: ["triLine", "triL", "line4", "square", "l4", "t4"], maxHp: 2, minGroups: 2, maxGroups: 4, maxLargeGroups: 1, maxHighHpGroups: 0, easyGroupTarget: 2, maxCenterCells: 4 },
  { targetCells: 11, durabilityBudget: 17, allowedShapes: ["line4", "square", "l4", "t4"], maxHp: 3, minGroups: 3, maxGroups: 4, maxLargeGroups: 1, maxHighHpGroups: 1, easyGroupTarget: 2, maxCenterCells: 4 },
  { targetCells: 12, durabilityBudget: 18, allowedShapes: ["line4", "square", "l4", "t4"], maxHp: 3, minGroups: 3, maxGroups: 4, maxLargeGroups: 1, maxHighHpGroups: 1, easyGroupTarget: 2, maxCenterCells: 4 },
  { targetCells: 12, durabilityBudget: 20, allowedShapes: ["square", "l4", "t4", "ring"], maxHp: 3, minGroups: 2, maxGroups: 3, maxLargeGroups: 1, maxHighHpGroups: 1, easyGroupTarget: 2, maxCenterCells: 4 },
  { targetCells: 13, durabilityBudget: 22, allowedShapes: ["square", "l4", "t4", "ring"], maxHp: 3, minGroups: 3, maxGroups: 4, maxLargeGroups: 1, maxHighHpGroups: 1, easyGroupTarget: 2, maxCenterCells: 4 },
  { targetCells: 14, durabilityBudget: 24, allowedShapes: ["line4", "square", "l4", "t4", "ring"], maxHp: 3, minGroups: 3, maxGroups: 4, maxLargeGroups: 2, maxHighHpGroups: 1, easyGroupTarget: 2, maxCenterCells: 5 },
  { targetCells: 14, durabilityBudget: 27, allowedShapes: ["line4", "square", "l4", "t4", "ring"], maxHp: 3, minGroups: 3, maxGroups: 4, maxLargeGroups: 2, maxHighHpGroups: 2, easyGroupTarget: 2, maxCenterCells: 5 },
  { targetCells: 15, durabilityBudget: 30, allowedShapes: ["square", "l4", "t4", "ring"], maxHp: 4, minGroups: 3, maxGroups: 4, maxLargeGroups: 2, maxHighHpGroups: 2, easyGroupTarget: 2, maxCenterCells: 5 },
  { targetCells: 16, durabilityBudget: 34, allowedShapes: ["line4", "square", "l4", "t4", "ring"], maxHp: 4, minGroups: 3, maxGroups: 4, maxLargeGroups: 2, maxHighHpGroups: 2, easyGroupTarget: 2, maxCenterCells: 6 }
);

function getLevelConfig(level) {
  return LEVEL_CONFIGS[clampLevel(level) - 1] || LEVEL_CONFIGS[0];
}

function getLevelTargetCount(level) {
  return getLevelConfig(level).durabilityBudget;
}

function countTargets(board) {
  var count = 0;
  for (var row = 0; row < BOARD_SIZE; row += 1) {
    for (var col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] && board[row][col].type === "target") {
        count += board[row][col].hp || 1;
      }
    }
  }
  return count;
}

function seedLevelTargets(board) {
  var config = getLevelConfig(state.currentLevel);
  var groups = [];
  var placements = [];

  try {
    groups = buildLevelGroups(config);
    placements = placeTargetGroups(board, groups, config);
  } catch (error) {
    var fallbackConfig = {
      targetCells: config.targetCells,
      durabilityBudget: config.durabilityBudget,
      allowedShapes: ["single", "domino", "triLine", "triL"],
      maxHp: Math.min(config.maxHp, 2),
      minGroups: config.minGroups,
      maxGroups: config.maxGroups,
      maxLargeGroups: Math.min(config.maxLargeGroups || 0, 1),
      maxHighHpGroups: Math.min(config.maxHighHpGroups || 0, 1),
      easyGroupTarget: Math.max(1, (config.easyGroupTarget || 2) - 1),
      maxCenterCells: (config.maxCenterCells || 4) + 1,
    };
    groups = buildLevelGroups(fallbackConfig);
    placements = placeTargetGroups(board, groups, fallbackConfig);
  }

  for (var index = 0; index < placements.length; index += 1) {
    var placement = placements[index];
    for (var cellIndex = 0; cellIndex < placement.cells.length; cellIndex += 1) {
      var cell = placement.cells[cellIndex];
      board[cell[0]][cell[1]] = { type: "target", hp: placement.hp, maxHp: placement.hp };
    }
  }
}

function buildLevelGroups(config) {
  var shapes = chooseGroupShapes(config);
  var hpValues = assignGroupHp(shapes, config);
  return shapes.map(function (shapeId, index) {
    return { shapeId: shapeId, hp: hpValues[index] };
  });
}

function chooseGroupShapes(config) {
  var result = fillShapeCells(config.targetCells, config, [], 0);
  if (!result) {
    throw new Error("Unable to build target groups for " + config.targetCells + " cells.");
  }
  return result;
}

function fillShapeCells(remainingCells, config, picked, largeGroupCount) {
  if (remainingCells === 0) {
    return picked.length >= config.minGroups && picked.length <= config.maxGroups ? picked : null;
  }

  if (picked.length >= config.maxGroups) {
    return null;
  }

  var allowedSizes = config.allowedShapes.map(function (shapeId) {
    return TARGET_SHAPE_LIBRARY[shapeId].cells.length;
  });
  var smallestShapeSize = Math.min.apply(null, allowedSizes);
  var largestShapeSize = Math.max.apply(null, allowedSizes);
  var groupsLeft = config.maxGroups - picked.length;
  var minGroupsLeft = Math.max(0, config.minGroups - picked.length);

  if (remainingCells < smallestShapeSize || remainingCells > groupsLeft * largestShapeSize) {
    return null;
  }
  if (minGroupsLeft * smallestShapeSize > remainingCells) {
    return null;
  }

  var candidates = shuffleArray(
    config.allowedShapes.filter(function (shapeId) {
      return TARGET_SHAPE_LIBRARY[shapeId].cells.length <= remainingCells;
    })
  );

  for (var index = 0; index < candidates.length; index += 1) {
    var shapeId = candidates[index];
    var nextLargeGroupCount = largeGroupCount + (isLargeTargetShape(shapeId) ? 1 : 0);
    if (nextLargeGroupCount > config.maxLargeGroups) {
      continue;
    }

    var next = fillShapeCells(
      remainingCells - TARGET_SHAPE_LIBRARY[shapeId].cells.length,
      config,
      picked.concat(shapeId),
      nextLargeGroupCount
    );
    if (next) {
      return next;
    }
  }

  return null;
}

function assignGroupHp(shapeIds, config) {
  var extraDurability = config.durabilityBudget - config.targetCells;
  var result = fillGroupHp(shapeIds, extraDurability, config, 0, [], 0);
  if (!result) {
    throw new Error("Unable to assign target hp for extra durability " + extraDurability + ".");
  }
  return result;
}

function fillGroupHp(shapeIds, remainingExtra, config, index, picked, highHpGroupCount) {
  if (index >= shapeIds.length) {
    return remainingExtra === 0 ? picked : null;
  }

  var shapeSize = TARGET_SHAPE_LIBRARY[shapeIds[index]].cells.length;
  var maxExtraSteps = Math.min(config.maxHp - 1, Math.floor(remainingExtra / shapeSize));
  var candidates = shuffleArray(Array.from({ length: maxExtraSteps + 1 }, function (_, value) { return value; }));

  for (var stepIndex = 0; stepIndex < candidates.length; stepIndex += 1) {
    var extraStep = candidates[stepIndex];
    var hp = extraStep + 1;
    var nextHighHpGroupCount = highHpGroupCount + (hp >= 3 ? 1 : 0);
    if (nextHighHpGroupCount > config.maxHighHpGroups) {
      continue;
    }

    var nextRemainingExtra = remainingExtra - extraStep * shapeSize;
    if (nextRemainingExtra > getRemainingExtraCapacity(shapeIds, index + 1, config.maxHp)) {
      continue;
    }

    var next = fillGroupHp(shapeIds, nextRemainingExtra, config, index + 1, picked.concat(hp), nextHighHpGroupCount);
    if (next) {
      return next;
    }
  }

  return null;
}

function getRemainingExtraCapacity(shapeIds, startIndex, maxHp) {
  var total = 0;
  for (var index = startIndex; index < shapeIds.length; index += 1) {
    total += TARGET_SHAPE_LIBRARY[shapeIds[index]].cells.length * (maxHp - 1);
  }
  return total;
}

function placeTargetGroups(board, groups, config) {
  var orderedGroups = groups.slice().sort(function (left, right) {
    return TARGET_SHAPE_LIBRARY[right.shapeId].cells.length - TARGET_SHAPE_LIBRARY[left.shapeId].cells.length || right.hp - left.hp;
  });

  for (var attempt = 0; attempt < 180; attempt += 1) {
    var workingBoard = cloneBoard(board);
    var placements = [];
    var failed = false;

    for (var groupIndex = 0; groupIndex < orderedGroups.length; groupIndex += 1) {
      var placement = findRandomPlacement(workingBoard, orderedGroups[groupIndex], placements, config);
      if (!placement) {
        failed = true;
        break;
      }
      stampTargetGroup(workingBoard, placement.cells, placement.hp);
      placements.push(placement);
    }

    if (!failed && isPlacementLayoutValid(placements, config)) {
      return placements;
    }
  }

  throw new Error("Unable to place target groups for level " + state.currentLevel + ".");
}

function findRandomPlacement(board, group, placements, config) {
  var candidates = [];

  for (var variantIndex = 0; variantIndex < getTargetShapeVariants(group.shapeId).length; variantIndex += 1) {
    var variant = getTargetShapeVariants(group.shapeId)[variantIndex];
    for (var row = 0; row <= BOARD_SIZE - variant.height; row += 1) {
      for (var col = 0; col <= BOARD_SIZE - variant.width; col += 1) {
        var absoluteCells = variant.cells.map(function (cell) {
          return [row + cell[0], col + cell[1]];
        });
        if (!canPlaceTargetGroup(board, absoluteCells, 1)) {
          continue;
        }

        var candidate = createTargetPlacementCandidate(group, absoluteCells);
        if (!isHighHpPlacementCompatible(candidate, placements)) {
          continue;
        }

        candidates.push(candidate);
      }
    }
  }

  if (!candidates.length) {
    return null;
  }

  var ranked = shuffleArray(candidates)
    .map(function (candidate) {
      return { candidate: candidate, score: scoreTargetPlacementCandidate(candidate, placements, config) };
    })
    .sort(function (left, right) {
      return right.score - left.score;
    });
  var shortlist = ranked.slice(0, Math.min(6, ranked.length)).map(function (entry) {
    return entry.candidate;
  });

  return randomChoice(shortlist);
}

function createTargetPlacementCandidate(group, cells) {
  var centerCellCount = cells.filter(function (cell) {
    return isTargetCoreCell(cell[0], cell[1]);
  }).length;
  return {
    shapeId: group.shapeId,
    hp: group.hp,
    cells: cells,
    centerCellCount: centerCellCount,
    easy: cells.some(function (cell) {
      return isEasyTargetCell(cell[0], cell[1]);
    }),
  };
}

function scoreTargetPlacementCandidate(candidate, placements, config) {
  var easyPlacedCount = placements.filter(function (placement) {
    return placement.easy;
  }).length;
  var centerCellCount = placements.reduce(function (total, placement) {
    return total + placement.centerCellCount;
  }, 0);
  var score = Math.random() * 0.35;

  if (easyPlacedCount < config.easyGroupTarget) {
    score += candidate.easy ? 5 : -4;
  } else if (candidate.easy) {
    score += 1.25;
  }

  score += candidate.cells.reduce(function (total, cell) {
    return total - getTargetEdgeDistance(cell[0], cell[1]);
  }, 0);
  score -= candidate.centerCellCount * 2.5;

  if (centerCellCount + candidate.centerCellCount > config.maxCenterCells) {
    score -= 12;
  }

  if (candidate.hp >= 3) {
    score -= placements.reduce(function (total, placement) {
      if (placement.hp < 3) {
        return total;
      }
      return total + getTargetPlacementProximityPenalty(candidate, placement);
    }, 0);
  }

  return score;
}

function isPlacementLayoutValid(placements, config) {
  var easyGroupCount = placements.filter(function (placement) {
    return placement.easy;
  }).length;
  var centerCellCount = placements.reduce(function (total, placement) {
    return total + placement.centerCellCount;
  }, 0);
  var highHpGroups = placements.filter(function (placement) {
    return placement.hp >= 3;
  });

  if (easyGroupCount < config.easyGroupTarget) {
    return false;
  }
  if (centerCellCount > config.maxCenterCells) {
    return false;
  }
  if (highHpGroups.length > config.maxHighHpGroups) {
    return false;
  }

  for (var index = 0; index < highHpGroups.length; index += 1) {
    for (var nextIndex = index + 1; nextIndex < highHpGroups.length; nextIndex += 1) {
      if (targetPlacementsAreNearby(highHpGroups[index], highHpGroups[nextIndex], 2)) {
        return false;
      }
    }
  }

  return true;
}

function isHighHpPlacementCompatible(candidate, placements) {
  if (candidate.hp < 3) {
    return true;
  }

  return placements.every(function (placement) {
    return placement.hp < 3 || !targetPlacementsAreNearby(candidate, placement, 2);
  });
}

function targetPlacementsAreNearby(left, right, distance) {
  return left.cells.some(function (leftCell) {
    return right.cells.some(function (rightCell) {
      return Math.max(Math.abs(leftCell[0] - rightCell[0]), Math.abs(leftCell[1] - rightCell[1])) <= distance;
    });
  });
}

function getTargetPlacementProximityPenalty(left, right) {
  var minDistance = Number.POSITIVE_INFINITY;

  for (var leftIndex = 0; leftIndex < left.cells.length; leftIndex += 1) {
    for (var rightIndex = 0; rightIndex < right.cells.length; rightIndex += 1) {
      var distance = Math.max(
        Math.abs(left.cells[leftIndex][0] - right.cells[rightIndex][0]),
        Math.abs(left.cells[leftIndex][1] - right.cells[rightIndex][1])
      );
      minDistance = Math.min(minDistance, distance);
    }
  }

  if (minDistance === Number.POSITIVE_INFINITY || minDistance > 3) {
    return 0;
  }

  return 4 - minDistance;
}

function isLargeTargetShape(shapeId) {
  return TARGET_SHAPE_LIBRARY[shapeId].cells.length >= 4;
}

function isTargetCoreCell(row, col) {
  return row >= 3 && row <= 6 && col >= 3 && col <= 6;
}

function isEasyTargetCell(row, col) {
  return !isCornerCell(row, col) && getTargetEdgeDistance(row, col) <= 1;
}

function getTargetEdgeDistance(row, col) {
  return Math.min(row, col, BOARD_SIZE - 1 - row, BOARD_SIZE - 1 - col);
}

function beginLevel(level) {
  var nextLevel = clampLevel(level);
  var config = getLevelConfig(nextLevel);

  clearNotice();
  state.currentLevel = nextLevel;
  state.targetsTotal = config.durabilityBudget;
  state.board = createEmptyBoard();
  seedLevelTargets(state.board);
  state.targetsRemaining = countTargets(state.board);
  state.slots = generatePieceSet();
  state.selectedSlot = null;
  state.pendingDrag = null;
  state.dragging = null;
  state.suppressBoardClick = false;
  state.hammerMode = false;
  state.placementsCount = 0;
  state.undoSnapshot = null;
  state.preview = null;
  state.clearMarks = null;
  state.isResolving = false;
  state.pendingNextLevel = null;
  resetDragGhost();
  showNotice("\u7b2c " + state.currentLevel + " \u5173\uff1a" + config.targetCells + " \u683c\u76ee\u6807\uff0c\u603b\u8010\u4e45 " + config.durabilityBudget);
}

function endGame(reason) {
  if (reason === void 0) {
    reason = "failed";
  }

  state.elapsedAtGameOver = getElapsedMs();
  state.status = "gameover";
  state.selectedSlot = null;
  state.pendingDrag = null;
  state.dragging = null;
  state.hammerMode = false;
  state.preview = null;
  state.pendingNextLevel = null;
  state.endReason = reason;
  clearNotice();
  updateProfileAfterGame();
  resetDragGhost();
  hideAllOverlays();
  var modeBestScore = getModeBestScore();
  finalScoreValueEl.textContent = String(state.score);
  finalBestValueEl.textContent = String(modeBestScore);
  finalRowsValueEl.textContent = String(state.totalRowsCleared);
  finalColsValueEl.textContent = String(state.totalColsCleared);
  finalComboValueEl.textContent = String(state.maxCombo);
  resultEyebrowEl.textContent = state.mode === "endless" ? "无尽" : reason === "cleared" ? "通关" : "结算";
  resultTitleEl.textContent =
    state.mode === "endless"
      ? "\u65e0\u5c3d\u6a21\u5f0f\u7ed3\u675f"
      : reason === "cleared"
        ? "\u5df2\u5b8c\u6210 " + TOTAL_LEVELS + " \u5173"
        : "\u672c\u5c40\u7ed3\u675f";
  restartButton.textContent =
    state.mode === "endless" ? "\u518d\u6765\u4e00\u5c40" : reason === "cleared" ? "\u91cd\u65b0\u95ef\u5173" : "\u518d\u6765\u4e00\u5c40";
  gameOverOverlayEl.classList.add("active");
  clearSavedSession();
  refreshResumeState();
  platformBridge.haptic(reason === "cleared" ? "success" : "warning");
  render();
}
// FINAL_TARGET_CONFIG_TUNING
LEVEL_CONFIGS.splice(
  0,
  LEVEL_CONFIGS.length,
  { targetCells: 3, durabilityBudget: 3, allowedShapes: ["single"], maxHp: 1, minGroups: 3, maxGroups: 3, maxLargeGroups: 0, maxHighHpGroups: 0, easyGroupTarget: 3, maxCenterCells: 1 },
  { targetCells: 4, durabilityBudget: 4, allowedShapes: ["single"], maxHp: 1, minGroups: 4, maxGroups: 4, maxLargeGroups: 0, maxHighHpGroups: 0, easyGroupTarget: 3, maxCenterCells: 1 },
  { targetCells: 5, durabilityBudget: 5, allowedShapes: ["single", "domino"], maxHp: 1, minGroups: 3, maxGroups: 4, maxLargeGroups: 0, maxHighHpGroups: 0, easyGroupTarget: 3, maxCenterCells: 2 },
  { targetCells: 6, durabilityBudget: 6, allowedShapes: ["single", "domino"], maxHp: 1, minGroups: 3, maxGroups: 4, maxLargeGroups: 0, maxHighHpGroups: 0, easyGroupTarget: 3, maxCenterCells: 2 },
  { targetCells: 6, durabilityBudget: 7, allowedShapes: ["single", "domino", "triLine", "triL"], maxHp: 2, minGroups: 3, maxGroups: 4, maxLargeGroups: 0, maxHighHpGroups: 0, easyGroupTarget: 3, maxCenterCells: 2 },
  { targetCells: 7, durabilityBudget: 8, allowedShapes: ["single", "domino", "triLine", "triL"], maxHp: 2, minGroups: 3, maxGroups: 4, maxLargeGroups: 0, maxHighHpGroups: 0, easyGroupTarget: 3, maxCenterCells: 2 },
  { targetCells: 8, durabilityBudget: 8, allowedShapes: ["domino", "triLine", "triL"], maxHp: 1, minGroups: 3, maxGroups: 4, maxLargeGroups: 0, maxHighHpGroups: 0, easyGroupTarget: 3, maxCenterCells: 3 },
  { targetCells: 8, durabilityBudget: 10, allowedShapes: ["domino", "triLine", "triL"], maxHp: 2, minGroups: 3, maxGroups: 4, maxLargeGroups: 0, maxHighHpGroups: 0, easyGroupTarget: 2, maxCenterCells: 3 },
  { targetCells: 9, durabilityBudget: 11, allowedShapes: ["domino", "triLine", "triL", "line4", "square"], maxHp: 2, minGroups: 3, maxGroups: 4, maxLargeGroups: 1, maxHighHpGroups: 0, easyGroupTarget: 2, maxCenterCells: 3 },
  { targetCells: 9, durabilityBudget: 12, allowedShapes: ["domino", "triLine", "triL", "line4", "square", "l4", "t4"], maxHp: 2, minGroups: 3, maxGroups: 4, maxLargeGroups: 1, maxHighHpGroups: 0, easyGroupTarget: 2, maxCenterCells: 3 },
  { targetCells: 10, durabilityBudget: 13, allowedShapes: ["domino", "triLine", "triL", "line4", "square", "l4"], maxHp: 2, minGroups: 3, maxGroups: 4, maxLargeGroups: 1, maxHighHpGroups: 0, easyGroupTarget: 2, maxCenterCells: 3 },
  { targetCells: 10, durabilityBudget: 14, allowedShapes: ["domino", "triLine", "triL", "line4", "square", "l4", "t4"], maxHp: 2, minGroups: 3, maxGroups: 4, maxLargeGroups: 1, maxHighHpGroups: 0, easyGroupTarget: 2, maxCenterCells: 4 },
  { targetCells: 11, durabilityBudget: 17, allowedShapes: ["domino", "triLine", "triL", "line4", "square", "l4", "t4"], maxHp: 3, minGroups: 3, maxGroups: 4, maxLargeGroups: 1, maxHighHpGroups: 1, easyGroupTarget: 2, maxCenterCells: 4 },
  { targetCells: 12, durabilityBudget: 18, allowedShapes: ["domino", "triLine", "triL", "line4", "square", "l4", "t4"], maxHp: 3, minGroups: 3, maxGroups: 4, maxLargeGroups: 2, maxHighHpGroups: 1, easyGroupTarget: 2, maxCenterCells: 4 },
  { targetCells: 12, durabilityBudget: 20, allowedShapes: ["domino", "triLine", "triL", "square", "l4", "t4", "ring"], maxHp: 3, minGroups: 3, maxGroups: 4, maxLargeGroups: 2, maxHighHpGroups: 1, easyGroupTarget: 2, maxCenterCells: 4 },
  { targetCells: 13, durabilityBudget: 22, allowedShapes: ["domino", "triLine", "triL", "line4", "square", "l4", "t4", "ring"], maxHp: 3, minGroups: 3, maxGroups: 4, maxLargeGroups: 2, maxHighHpGroups: 1, easyGroupTarget: 2, maxCenterCells: 5 },
  { targetCells: 14, durabilityBudget: 24, allowedShapes: ["domino", "triLine", "triL", "line4", "square", "l4", "t4", "ring"], maxHp: 3, minGroups: 3, maxGroups: 4, maxLargeGroups: 2, maxHighHpGroups: 1, easyGroupTarget: 2, maxCenterCells: 5 },
  { targetCells: 14, durabilityBudget: 25, allowedShapes: ["domino", "triLine", "triL", "line4", "square", "l4", "t4", "ring"], maxHp: 3, minGroups: 3, maxGroups: 4, maxLargeGroups: 2, maxHighHpGroups: 2, easyGroupTarget: 2, maxCenterCells: 5 },
  { targetCells: 15, durabilityBudget: 30, allowedShapes: ["domino", "triLine", "triL", "square", "l4", "t4", "ring"], maxHp: 4, minGroups: 3, maxGroups: 4, maxLargeGroups: 2, maxHighHpGroups: 2, easyGroupTarget: 2, maxCenterCells: 5 },
  { targetCells: 16, durabilityBudget: 34, allowedShapes: ["domino", "triLine", "triL", "line4", "square", "l4", "t4", "ring"], maxHp: 4, minGroups: 4, maxGroups: 4, maxLargeGroups: 2, maxHighHpGroups: 2, easyGroupTarget: 2, maxCenterCells: 6 }
);
// FINAL_TARGET_GROUP_RETRY
function buildLevelGroups(config) {
  for (var attempt = 0; attempt < 320; attempt += 1) {
    try {
      var shapes = chooseGroupShapes(config);
      var hpValues = assignGroupHp(shapes, config);
      return shapes.map(function (shapeId, index) {
        return { shapeId: shapeId, hp: hpValues[index] };
      });
    } catch (error) {
      // retry with another random shape/hp combination
    }
  }

  throw new Error("Unable to build target groups for level config.");
}
// FINAL_UI_TEXT_OVERRIDE
function renderHud() {
  rowsClearedValueEl.textContent = String(state.totalRowsCleared);
  colsClearedValueEl.textContent = String(state.totalColsCleared);
  maxComboValueEl.textContent = String(state.maxCombo);
  undoCountValueEl.textContent = String(state.undoCount);
  hammerCountValueEl.textContent = String(state.hammerCount);
  comboBadgeEl.textContent = "\u8fde\u51fb " + state.comboStreak;
  bestScoreValueEl.textContent = String(profile.bestScore || 0);
  phaseValueEl.textContent =
    state.status === "home"
      ? "\u5173\u5361\u4e3b\u9875 1-" + TOTAL_LEVELS
      : "\u7b2c " + state.currentLevel + " / " + TOTAL_LEVELS + " \u5173";
  targetValueEl.textContent =
    state.status === "home"
      ? "\u76ee\u6807 0/0"
      : "\u76ee\u6807 " + state.targetsRemaining + "/" + state.targetsTotal;
  pauseButton.disabled = state.status !== "playing" || state.isResolving;
  undoButton.disabled = !(state.status === "playing" && !state.isResolving && state.undoCount > 0 && state.undoSnapshot);
  hammerButton.disabled = !(state.status === "playing" && !state.isResolving && state.hammerCount > 0);
  hammerButton.classList.toggle("active", state.hammerMode);
}

function renderMessage() {
  if (state.status === "home") {
    boardMessageEl.textContent = "\u4e3b\u9875\u53ef\u9009\u62e9\u7ee7\u7eed\u5df2\u89e3\u9501\u5173\u5361\uff0c\u6216\u4ece\u7b2c\u4e00\u5173\u91cd\u65b0\u5f00\u59cb\u3002";
    return;
  }
  if (state.status === "paused") {
    boardMessageEl.textContent = "\u6e38\u620f\u5df2\u6682\u505c\uff0c\u5f53\u524d\u8fdb\u5ea6\u5df2\u4fdd\u7559\u3002";
    return;
  }
  if (state.status === "levelcomplete") {
    boardMessageEl.textContent = "\u672c\u5173\u5df2\u5b8c\u6210\uff0c\u8bf7\u9009\u62e9\u662f\u5426\u8fdb\u5165\u4e0b\u4e00\u5173\u3002";
    return;
  }
  if (state.status === "gameover") {
    boardMessageEl.textContent =
      state.endReason === "cleared"
        ? TOTAL_LEVELS + " \u5173\u5df2\u5168\u90e8\u901a\u5173\u3002"
        : "\u5df2\u7ecf\u6ca1\u6709\u4efb\u4f55\u5408\u6cd5\u843d\u70b9\u3002";
    return;
  }
  if (state.isResolving) {
    boardMessageEl.textContent = "\u6b63\u5728\u7ed3\u7b97\u672c\u6b21\u6d88\u9664...";
    return;
  }
  if (state.dragging) {
    boardMessageEl.textContent =
      state.preview && state.preview.valid
        ? "\u677e\u624b\u5373\u53ef\u653e\u4e0b\u5f53\u524d\u65b9\u5757\u3002"
        : "\u62d6\u5230\u68cb\u76d8\u7a7a\u4f4d\u4e0a\uff0c\u76ee\u6807\u5757\u548c\u5df2\u6709\u65b9\u5757\u90fd\u4e0d\u80fd\u8986\u76d6\u3002";
    return;
  }
  if (state.hammerMode) {
    boardMessageEl.textContent = "\u9524\u5b50\u6a21\u5f0f\uff1a\u70b9\u51fb\u76ee\u6807\u5757\u4f1a\u51cf\u5c11 1 \u70b9\u8010\u4e45\uff0c\u70b9\u51fb\u5f69\u5757\u53ef\u76f4\u63a5\u6e05\u9664\u3002";
    return;
  }
  if (state.notice) {
    boardMessageEl.textContent = state.notice;
    return;
  }
  if (state.selectedSlot === null) {
    boardMessageEl.textContent = "\u6e05\u7a7a\u5168\u90e8\u76ee\u6807\u8010\u4e45\u5373\u53ef\u8fc7\u5173\uff0c\u4ece\u5e95\u90e8\u62d6\u52a8\u65b9\u5757\u5230\u68cb\u76d8\u5f00\u59cb\u5e03\u5c40\u3002";
    return;
  }
  if (state.preview && state.preview.valid) {
    boardMessageEl.textContent = "\u5f53\u524d\u4f4d\u7f6e\u5408\u6cd5\uff0c\u70b9\u51fb\u5373\u53ef\u653e\u7f6e\u3002";
    return;
  }
  boardMessageEl.textContent = "\u79fb\u52a8\u5230\u68cb\u76d8\u53ef\u67e5\u770b\u9884\u89c8\uff0c\u975e\u6cd5\u4f4d\u7f6e\u4e0d\u4f1a\u663e\u793a\u843d\u70b9\u3002";
}

function refreshResumeState() {
  var session = loadSession();
  var unlockedLevel = getUnlockedLevel();
  var sessionLevel = (session && (session.pendingNextLevel || session.currentLevel)) || unlockedLevel;
  var canContinue = Boolean(session) || unlockedLevel > 1;

  continueButton.disabled = !canContinue;

  if (session) {
    continueButton.textContent = "\u7ee7\u7eed\u7b2c " + sessionLevel + " \u5173";
    continueHintEl.textContent =
      session.status === "levelcomplete" && session.pendingNextLevel
        ? "\u4e0a\u4e00\u5173\u5df2\u5b8c\u6210\uff0c\u53ef\u76f4\u63a5\u8fdb\u5165\u7b2c " + session.pendingNextLevel + " \u5173\u3002"
        : "\u68c0\u6d4b\u5230\u672a\u5b8c\u6210\u8fdb\u5ea6\uff0c\u5c06\u7ee7\u7eed\u7b2c " + sessionLevel + " \u5173\u3002";
    return;
  }

  if (unlockedLevel > 1) {
    continueButton.textContent = "\u7ee7\u7eed\u7b2c " + unlockedLevel + " \u5173";
    continueHintEl.textContent = "\u5f53\u524d\u5df2\u89e3\u9501\u5230\u7b2c " + unlockedLevel + " \u5173\u3002";
    return;
  }

  continueButton.textContent = "\u7ee7\u7eed\u5173\u5361";
  continueHintEl.textContent = "\u5f53\u524d\u8fd8\u6ca1\u6709\u53ef\u7ee7\u7eed\u7684\u5173\u5361\uff0c\u8bf7\u4ece\u7b2c\u4e00\u5173\u5f00\u59cb\u3002";
}

// FINAL_UI_TEXT_OVERRIDE_CLEAN
function renderHud() {
  rowsClearedValueEl.textContent = String(state.totalRowsCleared);
  colsClearedValueEl.textContent = String(state.totalColsCleared);
  maxComboValueEl.textContent = String(state.maxCombo);
  undoCountValueEl.textContent = String(state.undoCount);
  hammerCountValueEl.textContent = String(state.hammerCount);
  comboBadgeEl.textContent = "\u8fde\u51fb " + state.comboStreak;
  bestScoreValueEl.textContent = String(getModeBestScore());
  phaseValueEl.textContent =
    state.status === "home"
      ? state.mode === "endless"
        ? "\u65e0\u5c3d\u6a21\u5f0f"
        : "\u5173\u5361\u4e3b\u9875 1-" + TOTAL_LEVELS
      : state.mode === "endless"
        ? "\u65e0\u5c3d\u6ce2\u6b21 " + state.endlessWave
        : "\u7b2c " + state.currentLevel + " / " + TOTAL_LEVELS + " \u5173";
  targetValueEl.textContent =
    state.status === "home"
      ? "\u76ee\u6807 0/0"
      : state.mode === "endless"
        ? "\u9ed1\u5757 " + state.targetsRemaining
        : "\u76ee\u6807 " + state.targetsRemaining + "/" + state.targetsTotal;
  pauseButton.disabled = state.status !== "playing" || state.isResolving;
  undoButton.disabled = !(state.status === "playing" && !state.isResolving && state.undoCount > 0 && state.undoSnapshot);
  hammerButton.disabled = !(state.status === "playing" && !state.isResolving && state.hammerCount > 0);
  hammerButton.classList.toggle("active", state.hammerMode);
}

function renderMessage() {
  if (state.status === "home") {
    boardMessageEl.textContent = "\u53ef\u4ee5\u9009\u62e9\u7ee7\u7eed\u4e0a\u6b21\u5bf9\u5c40\uff0c\u6216\u5728\u95ef\u5173\u4e0e\u65e0\u5c3d\u6a21\u5f0f\u4e4b\u95f4\u5207\u6362\u3002";
    return;
  }
  if (state.status === "paused") {
    boardMessageEl.textContent = "\u6e38\u620f\u5df2\u6682\u505c\uff0c\u5f53\u524d\u8fdb\u5ea6\u5df2\u81ea\u52a8\u4fdd\u5b58\u3002";
    return;
  }
  if (state.status === "levelcomplete") {
    boardMessageEl.textContent = "\u672c\u5173\u5df2\u5b8c\u6210\uff0c\u53ef\u4ee5\u9009\u62e9\u8fdb\u5165\u4e0b\u4e00\u5173\u6216\u8fd4\u56de\u4e3b\u9875\u3002";
    return;
  }
  if (state.status === "gameover") {
    boardMessageEl.textContent =
      state.mode === "endless"
        ? "\u9ed1\u5757\u538b\u529b\u5df2\u7ecf\u5c01\u6b7b\u68cb\u76d8\uff0c\u4f46\u8fd8\u80fd\u518d\u6765\u4e00\u5c40\u3002"
        : state.endReason === "cleared"
        ? "\u606d\u559c\u901a\u5173\u5168\u90e8 " + TOTAL_LEVELS + " \u5173\u3002"
        : "\u5df2\u7ecf\u6ca1\u6709\u53ef\u4ee5\u653e\u7f6e\u7684\u5408\u6cd5\u4f4d\u7f6e\u3002";
    return;
  }
  if (state.isResolving) {
    boardMessageEl.textContent = "\u6b63\u5728\u7ed3\u7b97\u672c\u6b21\u6d88\u9664...";
    return;
  }
  if (state.dragging) {
    boardMessageEl.textContent =
      state.preview && state.preview.valid
        ? "\u677e\u624b\u5373\u53ef\u653e\u4e0b\u5f53\u524d\u65b9\u5757\u3002"
        : "\u8bf7\u62d6\u5230\u68cb\u76d8\u7a7a\u4f4d\uff0c\u4e14\u4e0d\u80fd\u8986\u76d6\u76ee\u6807\u5757\u6216\u5df2\u6709\u65b9\u5757\u3002";
    return;
  }
  if (state.hammerMode) {
    boardMessageEl.textContent = "\u9524\u5b50\u6a21\u5f0f\uff1a\u70b9\u51fb\u76ee\u6807\u5757\u51cf\u5c11 1 \u70b9\u8010\u4e45\uff0c\u70b9\u51fb\u5f69\u8272\u65b9\u5757\u53ef\u76f4\u63a5\u6e05\u9664\u3002";
    return;
  }
  if (state.notice) {
    boardMessageEl.textContent = state.notice;
    return;
  }
  if (state.selectedSlot === null) {
    boardMessageEl.textContent =
      state.mode === "endless"
        ? "\u65e0\u5c3d\u6a21\u5f0f\u4f1a\u968f\u5206\u6570\u4e0d\u65ad\u751f\u6210\u9ed1\u5757\uff0c\u591a\u5229\u7528\u4ea4\u53c9\u6d88\u9664\u6253\u6389\u9ad8\u8010\u4e45\u76ee\u6807\u3002"
        : "\u6e05\u7a7a\u6240\u6709\u76ee\u6807\u8010\u4e45\u5373\u53ef\u8fc7\u5173\uff0c\u4ece\u5e95\u90e8\u62d6\u52a8\u65b9\u5757\u5230\u68cb\u76d8\u5f00\u59cb\u5e03\u5c40\u3002";
    return;
  }
  if (state.preview && state.preview.valid) {
    boardMessageEl.textContent = "\u5f53\u524d\u4f4d\u7f6e\u53ef\u4ee5\u653e\u7f6e\uff0c\u70b9\u51fb\u6216\u677e\u624b\u5373\u53ef\u843d\u4e0b\u3002";
    return;
  }
  boardMessageEl.textContent = "\u79fb\u52a8\u5230\u68cb\u76d8\u53ef\u67e5\u770b\u9884\u89c8\uff0c\u975e\u6cd5\u4f4d\u7f6e\u4e0d\u4f1a\u663e\u793a\u843d\u70b9\u3002";
}

function refreshResumeState() {
  var session = loadSession();
  var unlockedLevel = getUnlockedLevel();
  var sessionLevel = (session && (session.pendingNextLevel || session.currentLevel)) || unlockedLevel;
  var canContinue = Boolean(session) || unlockedLevel > 1;

  continueButton.disabled = !canContinue;

  if (session) {
    continueButton.textContent =
      session.mode === "endless" ? "\u7ee7\u7eed\u65e0\u5c3d\u6a21\u5f0f" : "\u7ee7\u7eed\u7b2c " + sessionLevel + " \u5173";
    continueHintEl.textContent =
      session.mode === "endless"
        ? "\u4e0a\u6b21\u65e0\u5c3d\u5f97\u5206 " + (session.score || 0) + " \u5206"
        : session.status === "levelcomplete" && session.pendingNextLevel
        ? "\u53ef\u76f4\u63a5\u8fdb\u5165\u7b2c " + session.pendingNextLevel + " \u5173"
        : "\u4e0a\u6b21\u8fdb\u5ea6\uff1a\u7b2c " + sessionLevel + " \u5173";
    return;
  }

  if (unlockedLevel > 1) {
    continueButton.textContent = "\u7ee7\u7eed\u7b2c " + unlockedLevel + " \u5173";
    continueHintEl.textContent = "\u5df2\u89e3\u9501\u5230\u7b2c " + unlockedLevel + " \u5173";
    return;
  }

  continueButton.textContent = "\u7ee7\u7eed\u6e38\u620f";
  continueHintEl.textContent = "\u4ece\u7b2c 1 \u5173\u5f00\u59cb";
}

