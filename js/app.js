const state = {
  xp: Number(localStorage.getItem("darlingXP") || 0),
  currentScreen: "screen-start"
};

const screens = [...document.querySelectorAll(".screen")];

const $ = (selector) => document.querySelector(selector);


let bootProgress = 0;
const bootProgressEl = $("#bootProgress");
const bootPercentEl = $("#loading-percent");
const bootTextEl = $("#bootText");
const startGameButton = $("#screen-start [data-next='screen-profile']");
if (startGameButton) startGameButton.disabled = true;
if (bootProgressEl) bootProgressEl.style.width = "0%";

const boot = setInterval(() => {
  bootProgress += 20;
  if (bootProgressEl) bootProgressEl.style.width = bootProgress + "%";
  if (bootPercentEl) bootPercentEl.textContent = bootProgress + "%";

  if (bootProgress >= 100) {
    clearInterval(boot);
    if (bootTextEl) bootTextEl.textContent = "DARLING.EXE READY. MISSION AVAILABLE.";
    if (startGameButton) {
      startGameButton.disabled = false;
      startGameButton.classList.add("boot-ready");
    }
  }
}, 180);

// web audio for sound effects
let audioContext = null;
function ensureAudioContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) audioContext = new AudioCtx();
  }
  if (audioContext?.state === "suspended") audioContext.resume().catch(() => {});
  return audioContext;
}

function playTone(type = "click") {
  const ctx = ensureAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  const settings = {
    click: {freq: 520, end: 680, duration: .07, volume: .035, wave: "square"},
    page: {freq: 300, end: 620, duration: .16, volume: .045, wave: "sine"},
    correct: {freq: 520, end: 880, duration: .22, volume: .055, wave: "triangle"},
    wrong: {freq: 220, end: 130, duration: .16, volume: .045, wave: "sawtooth"},
    catch: {freq: 720, end: 1040, duration: .09, volume: .045, wave: "triangle"},
    hit: {freq: 180, end: 90, duration: .09, volume: .05, wave: "square"},
    win: {freq: 520, end: 1040, duration: .35, volume: .055, wave: "sine"}
  }[type] || {freq: 520, end: 680, duration: .07, volume: .035, wave: "square"};

  osc.type = settings.wave;
  osc.frequency.setValueAtTime(settings.freq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, settings.end), now + settings.duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(settings.volume, now + .01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + settings.duration);
  osc.start(now);
  osc.stop(now + settings.duration + .02);
}

const bgMusic = $("#bgMusic");
const MUSIC = {
  start: "assets/audio/sunflower.mp3",
  birthday: "assets/audio/birthday-bridge.mp3",
  monthsary: "assets/audio/photograph-bridge.mp3"
};
let musicChapter = "";

function setMusic(chapter) {
  if (!bgMusic || !MUSIC[chapter] || musicChapter === chapter) return;
  musicChapter = chapter;
  bgMusic.src = MUSIC[chapter];
  bgMusic.volume = chapter === "start" ? 0.16 : 0.13;
  bgMusic.currentTime = 0;
  bgMusic.play().catch(() => {
  });
}

function resumeMusic() {
  ensureAudioContext();
  if (bgMusic?.src) bgMusic.play().catch(() => {});
  else setMusic(musicChapter || "start");
}

setMusic("start");
document.addEventListener("pointerdown", resumeMusic, {once: false});
document.addEventListener("keydown", resumeMusic, {once: false});


function updateXP(amount = 0) {
  state.xp += amount;
  localStorage.setItem("darlingXP", String(state.xp));
  document.querySelectorAll("[id^='xp-']").forEach(el => {
    el.textContent = String(state.xp).padStart(3, "0");
  });
}

function showScreen(id) {
  const previous = state.currentScreen;
  screens.forEach(screen => screen.classList.toggle("active", screen.id === id));
  state.currentScreen = id;
  window.scrollTo({ top: 0, behavior: "instant" });

  if (previous !== id) {
    playTone("page");
    if (id === "screen-birthday") {
      setMusic("birthday");
      playTone("win");
    } else if (id === "screen-monthsary") {
      setMusic("monthsary");
      playTone("win");
    }
  }
}

document.querySelectorAll("[data-next]").forEach(button => {
  button.addEventListener("click", () => {
    playTone("click");
    resumeMusic();
    showScreen(button.dataset.next);
  });
});

document.querySelectorAll(".choice-card").forEach(card => {
  card.addEventListener("click", () => {
    resumeMusic();
    const feedback = document.getElementById("hero-feedback");
    const next = document.getElementById("hero-next");

    feedback.classList.remove("feedback-wrong", "feedback-correct");
    feedback.style.background = "";
    feedback.style.borderColor = "";
    feedback.style.color = "";
    document.querySelectorAll(".choice-card").forEach(c => c.classList.remove("correct-hit"));

    if (card.dataset.correct === "true") {
      document.querySelectorAll(".choice-card").forEach(c => c.disabled = true);
      card.classList.add("correct-hit");
      updateXP(100);
      playTone("correct");

      feedback.hidden = false;
      feedback.classList.add("feedback-correct");
      feedback.innerHTML = `
        <strong>💥 CORRECT!</strong><br>
        HERO IDENTIFIED.<br>
        <span style="font-weight:500;">Okay... maybe that one was a little obvious. 😌</span>
      `;
      next.classList.remove("hidden");
    } else {
      playTone("wrong");
      card.classList.remove("wrong");
      void card.offsetWidth;
      card.classList.add("wrong");

      feedback.hidden = false;
      feedback.classList.add("feedback-wrong");
      feedback.innerHTML = `
        <strong>❌ NOT QUITE.</strong><br>
        Try again, Player 01. 👀
      `;
    }
  });
});

const memories = {
  "first-date": {
    label: "FIRST DATE",
    title: "Movie + Steakhouse.",
    text: "The first little chapter of us. A movie, good food, and the beginning of so many more dates.",
    icon: "🎬",
    photo: "assets/images/photos/first-date.jpg",
    note: "It really took us one date, and we were already inseparable. I love you, my darling. ❤️"
  },
  "cafes": {
    label: "CAFE HOPPING",
    title: "Coffee, food, conversations, repeat.",
    text: "One cafe turns into another cafe because apparently finding our next favorite place is part of the date.",
    icon: "☕",
    photo: "assets/images/photos/cafes.jpg",
    note: "To more cafe hopping adventures, and to more coffee dates with you. ☕"
  },
  "food": {
    label: "FOOD QUEST",
    title: "Every date needs food.",
    text: "A very important rule of our relationship: there is probably food involved somewhere.",
    icon: "🍽️",
    photo: "assets/images/photos/food.jpg",
    note: "You are my favorite food buddy, and I love that we can share our love for food together. 🍽️"
  },
  "rides": {
    label: "MOTORCYCLE ADVENTURES",
    title: "No destination? Let's ride.",
    text: "Getting on the motorcycle and looking for somewhere to go is already an adventure by itself.",
    icon: "🏍️",
    photo: "assets/images/photos/rides.jpg",
    note: "We may not always know where we're going, but as long as we're together, it's always an adventure. 🏍️"
  },
  "games": {
    label: "GAME MODE",
    title: "Player 01: Rjuri.",
    text: "Games, Spider-Man, and all the little things that make you happy. This node is permanently in gamer mode.",
    icon: "🎮",
    photo: "assets/images/photos/games.jpg",
    note: "Even if we don't always play the same games, I love that we can share our love for mind and relaxing games together. 🎮"
  },
  "secret": {
    label: "SECRET MEMORY",
    title: "Still loading...",
    text: "For the memory we haven't remembered yet. One day we'll laugh and say, 'Remember when...?'",
    icon: "♡",
    photo: "assets/images/photos/secret.jpg",
    note: "This is a secret memory, and I can't wait to make more memories with you, my darling. ♡"
  }
};

let selectedMemory = "first-date";
const memoryModal = document.getElementById("memory-modal");

function openMemoryModal(key) {
  const m = memories[key];
  if (!m || !memoryModal) return;
  selectedMemory = key;
  document.getElementById("modal-memory-label").textContent = m.label;
  document.getElementById("modal-memory-title").textContent = m.title;
  document.getElementById("modal-memory-copy").textContent = m.text;
  document.getElementById("modal-memory-note").textContent = m.note;
  const photo = document.getElementById("modal-memory-photo");
  photo.textContent = m.icon;
  photo.style.backgroundImage = `url("${m.photo}")`;
  photo.classList.remove("has-photo");
  const testImage = new Image();
  testImage.onload = () => photo.classList.add("has-photo");
  testImage.onerror = () => {};
  testImage.src = m.photo;
  memoryModal.hidden = false;
  memoryModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeMemoryModal() {
  if (!memoryModal) return;
  memoryModal.hidden = true;
  memoryModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

document.querySelectorAll(".memory-node").forEach(node => {
  node.addEventListener("click", () => {
    const key = node.dataset.memory;
    const m = memories[key];
    if (!m) return;
    selectedMemory = key;
    document.querySelectorAll(".memory-node").forEach(n => n.classList.toggle("active", n === node));
    document.getElementById("memory-image").textContent = m.icon;
    document.getElementById("memory-label").textContent = m.label;
    document.getElementById("memory-title").textContent = m.title;
    document.getElementById("memory-text").textContent = m.text;
    updateXP(10);
    playTone("click");
  });
});

document.getElementById("memory-card")?.addEventListener("click", () => openMemoryModal(selectedMemory));
document.querySelectorAll("[data-close-memory]").forEach(el => el.addEventListener("click", closeMemoryModal));
document.addEventListener("keydown", event => { if (event.key === "Escape") closeMemoryModal(); });

let joTaps = 0;
let joTapTimer = null;
const secretToast = document.getElementById("secret-toast");
document.getElementById("jo-secret")?.addEventListener("click", () => {
  joTaps++;
  clearTimeout(joTapTimer);
  joTapTimer = setTimeout(() => { joTaps = 0; }, 1300);
  if (joTaps >= 5) {
    joTaps = 0;
    updateXP(50);
    secretToast.textContent = "🕷️ SPIDER-SENSE UNLOCKED — JO = MY DARLING ♡";
    secretToast.classList.add("show");
    setTimeout(() => secretToast.classList.remove("show"), 2400);
  }
});

// mission 2: web shooter minigame
let shooterRunning = false;
let hearts = 0;
let shooterTime = 50;
let shooterTimer = null;
let shooterSpawner = null;

function clearShooter() {
  clearInterval(shooterTimer);
  clearInterval(shooterSpawner);
  shooterTimer = null;
  shooterSpawner = null;
  document.querySelectorAll(".shooter-heart").forEach(el => el.remove());
}

function finishShooter(success) {
  shooterRunning = false;
  clearShooter();
  const start = document.getElementById("start-shooter");
  const next = document.getElementById("shooter-next");
  const message = document.getElementById("shooter-message");

  if (success) {
    message.textContent = "THWIP! HEARTS CAUGHT. 💗";
    start.classList.add("hidden");
    next.classList.remove("hidden");
    updateXP(100);
  } else {
    message.textContent = "THE WEB MISSED. TRY AGAIN! 🕸️";
    start.classList.remove("hidden");
    start.textContent = "TRY AGAIN";
  }
}

function spawnHeart() {
  if (!shooterRunning) return;
  const arena = document.getElementById("shooter-arena");
  if (!arena) return;

  const heart = document.createElement("button");
  heart.type = "button";
  heart.className = "shooter-heart";
  heart.textContent = ["♡", "♥", "💗"][Math.floor(Math.random() * 3)];
  heart.style.left = `${7 + Math.random() * 82}%`;
  heart.style.top = `${14 + Math.random() * 72}%`;
  heart.setAttribute("aria-label", "Catch heart");

  const catchHeart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!shooterRunning) return;
    hearts++;
    playTone("catch");
    document.getElementById("heart-count").textContent = hearts;
    heart.remove();
    if (hearts >= 10) {
      finishShooter(true);
    }
  };

  heart.addEventListener("pointerdown", catchHeart, { once: true });
  heart.addEventListener("click", catchHeart, { once: true });
  arena.appendChild(heart);
  setTimeout(() => heart.remove(), 1700);
}

function startShooter() {
  clearShooter();
  shooterRunning = true;
  hearts = 0;
  shooterTime = 20;

  document.getElementById("heart-count").textContent = "0";
  document.getElementById("shooter-timer").textContent = "20";
  document.getElementById("shooter-message").textContent = "CATCH THEM!";
  document.getElementById("start-shooter").textContent = "WEB SHOOTER ACTIVE...";
  document.getElementById("shooter-next").classList.add("hidden");

  spawnHeart();
  shooterSpawner = setInterval(() => {
    if (shooterRunning && hearts < 10) spawnHeart();
  }, 700);

  shooterTimer = setInterval(() => {
    shooterTime--;
    document.getElementById("shooter-timer").textContent = shooterTime;
    if (shooterTime <= 0 && hearts < 10) finishShooter(false);
  }, 1000);
}

document.addEventListener("pointerup", (event) => {
  const start = event.target.closest?.("#start-shooter");
  if (start) {
    event.preventDefault();
    if (!shooterRunning) startShooter();
  }
});

document.addEventListener("click", (event) => {
  const start = event.target.closest?.("#start-shooter");
  if (start) {
    event.preventDefault();
    if (!shooterRunning) startShooter();
  }
});

let bossHP = 100;

document.getElementById("birthday-cake").addEventListener("click", () => {
  playTone("hit");
  bossHP = Math.max(0, bossHP - 10);
  document.getElementById("boss-hp-bar").style.width = `${bossHP}%`;
  document.getElementById("boss-hp-text").textContent = bossHP;

  const attacks = ["POW!", "WHAM!", "THWIP!", "BONK!"];
  document.getElementById("boss-feedback").textContent = attacks[Math.floor(Math.random() * attacks.length)];

  if (bossHP === 0) {
    document.getElementById("birthday-cake").textContent = "🎉";
    document.getElementById("boss-feedback").textContent = "BOSS DEFEATED! HAPPY BIRTHDAY, MY JO! ❤️";
    updateXP(100);
    setTimeout(() => showScreen("screen-birthday"), 800);
  }
});

document.getElementById("restart-v2").addEventListener("click", () => {
  playTone("click");
  clearShooter();
  bossHP = 100;
  document.getElementById("boss-hp-bar").style.width = "100%";
  document.getElementById("boss-hp-text").textContent = "100";
  document.getElementById("birthday-cake").textContent = "🎂";
  document.getElementById("boss-feedback").textContent = "TAP TO ATTACK!";
  document.getElementById("start-shooter").classList.remove("hidden");
  document.getElementById("start-shooter").textContent = "START WEB SHOOTER";
  document.getElementById("shooter-next").classList.add("hidden");
  showScreen("screen-start");
});

document.getElementById("boyfriend-name").textContent =
  localStorage.getItem("darlingPlayerName") || "RJURI";

document.addEventListener("DOMContentLoaded", () => updateXP(0));
