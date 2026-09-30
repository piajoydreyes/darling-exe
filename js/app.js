const state = {
  xp: Number(localStorage.getItem("darlingXP") || 0),
  currentScreen: "screen-start"
};

const screens = [...document.querySelectorAll(".screen")];

function updateXP(amount = 0) {
  state.xp += amount;
  localStorage.setItem("darlingXP", String(state.xp));
  document.querySelectorAll("[id^='xp-']").forEach(el => {
    el.textContent = String(state.xp).padStart(3, "0");
  });
}

function showScreen(id) {
  screens.forEach(screen => screen.classList.toggle("active", screen.id === id));
  state.currentScreen = id;
  window.scrollTo({ top: 0, behavior: "instant" });
}

document.querySelectorAll("[data-next]").forEach(button => {
  button.addEventListener("click", () => showScreen(button.dataset.next));
});

/* V1 HERO CHOICE — retained */
document.querySelectorAll(".choice-card").forEach(card => {
  card.addEventListener("click", () => {
    const feedback = document.getElementById("hero-feedback");
    const next = document.getElementById("hero-next");

    if (card.dataset.correct === "true") {
      document.querySelectorAll(".choice-card").forEach(c => c.disabled = true);
      card.classList.add("correct-hit");
      updateXP(100);

      feedback.hidden = false;
      feedback.innerHTML = `
        <strong>💥 CORRECT!</strong><br>
        HERO IDENTIFIED.<br>
        <span style="font-weight:500;">Okay... maybe that one was a little obvious. 😌</span>
      `;
      next.classList.remove("hidden");
    } else {
      card.classList.remove("wrong");
      void card.offsetWidth;
      card.classList.add("wrong");

      feedback.hidden = false;
      feedback.style.background = "rgba(230,36,41,.08)";
      feedback.style.borderColor = "rgba(230,36,41,.25)";
      feedback.style.color = "#ffb4b6";
      feedback.innerHTML = `
        <strong>❌ NOT QUITE.</strong><br>
        Try again, Player 01. 👀
      `;
    }
  });
});

/* V3 MEMORY WEB — collectible memories + photo-ready lightbox */
const memories = {
  "first-date": {
    label: "FIRST DATE",
    title: "Movie + steakhouse.",
    text: "The first little chapter of us. A movie, good food, and the beginning of so many more dates.",
    icon: "🎬",
    photo: "assets/images/photos/first-date.jpg",
    note: "Replace assets/images/photos/first-date.jpg with your actual photo when you're ready."
  },
  "cafes": {
    label: "CAFE HOPPING",
    title: "Coffee, food, conversations, repeat.",
    text: "One cafe turns into another cafe because apparently finding our next favorite place is part of the date.",
    icon: "☕",
    photo: "assets/images/photos/cafes.jpg",
    note: "Replace assets/images/photos/cafes.jpg with a favorite cafe photo."
  },
  "food": {
    label: "FOOD QUEST",
    title: "Every date needs food.",
    text: "A very important rule of our relationship: there is probably food involved somewhere.",
    icon: "🍽️",
    photo: "assets/images/photos/food.jpg",
    note: "Replace assets/images/photos/food.jpg with a food/date photo."
  },
  "rides": {
    label: "MOTORCYCLE ADVENTURES",
    title: "No destination? Let's ride.",
    text: "Getting on the motorcycle and looking for somewhere to go is already an adventure by itself.",
    icon: "🏍️",
    photo: "assets/images/photos/rides.jpg",
    note: "Replace assets/images/photos/rides.jpg with a ride photo."
  },
  "games": {
    label: "GAME MODE",
    title: "Player 01: Rjuri.",
    text: "Games, Spider-Man, and all the little things that make you happy. This node is permanently in gamer mode.",
    icon: "🎮",
    photo: "assets/images/photos/games.jpg",
    note: "Replace assets/images/photos/games.jpg with a gaming or Spider-Man memory."
  },
  "secret": {
    label: "SECRET MEMORY",
    title: "Still loading...",
    text: "For the memory we haven't remembered yet. One day we'll laugh and say, 'Remember when...?'",
    icon: "♡",
    photo: "assets/images/photos/secret.jpg",
    note: "This is your blank slot. Put any future memory here."
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
  });
});

document.getElementById("memory-card")?.addEventListener("click", () => openMemoryModal(selectedMemory));
document.querySelectorAll("[data-close-memory]").forEach(el => el.addEventListener("click", closeMemoryModal));
document.addEventListener("keydown", event => { if (event.key === "Escape") closeMemoryModal(); });

/* Hidden JO easter egg: tap the center 5 times. */
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

/* V2 WEB SHOOTER — robust touch/click version */
let shooterRunning = false;
let hearts = 0;
let shooterTime = 20;
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

/* Event delegation makes the shooter reliable after screen transitions and on touch devices. */
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

/* V2 BIRTHDAY BOSS */
let bossHP = 100;

document.getElementById("birthday-cake").addEventListener("click", () => {
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

/* V2 RESTART */
document.getElementById("restart-v2").addEventListener("click", () => {
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

/* PERSONALIZATION */
document.getElementById("boyfriend-name").textContent =
  localStorage.getItem("darlingPlayerName") || "RJURI";

document.addEventListener("DOMContentLoaded", () => updateXP(0));
