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

function showScreen(id, addToHistory = true) {

  const previous = state.currentScreen;

  screens.forEach(screen =>
    screen.classList.toggle("active", screen.id === id)
  );

  state.currentScreen = id;

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });

  // Add the screen to browser history
  if (addToHistory && previous !== id) {
    history.pushState(
      { screen: id },
      "",
      "#" + id.replace("screen-", "")
    );
  }

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


// ========================================
// MISSION 05 - HEART.EXE RELATIONSHIP QUIZ
// ========================================
let quizQuestion = 0;
let quizLocked = false;

const quizQuestions = document.querySelectorAll(".quiz-question");
const quizProgress = document.getElementById("quiz-progress");
const quizFeedback = document.getElementById("quiz-feedback");
const quizNext = document.getElementById("quiz-next");

function showQuizQuestion(index) {
  quizQuestions.forEach((question, i) => {
    question.classList.toggle("hidden", i !== index);
  });
  if (quizProgress) {
    quizProgress.textContent = `QUESTION ${String(index + 1).padStart(2, "0")} / ${quizQuestions.length}`;
  }
}

document.querySelectorAll(".quiz-option").forEach(option => {
  option.addEventListener("click", () => {
    if (quizLocked) return;

    const question = option.closest(".quiz-question");
    if (!question) return;

    const options = question.querySelectorAll(".quiz-option");
    options.forEach(button => button.disabled = true);

    if (option.dataset.answer === "correct") {
      option.classList.add("correct");
      playTone("correct");
      updateXP(25);

      if (quizFeedback) {
        quizFeedback.textContent = quizQuestion === quizQuestions.length - 1
          ? "ACCESS GRANTED. YOU KNOW US. ❤️"
          : "CORRECT. NEXT QUESTION...";
        quizFeedback.className = "quiz-feedback correct";
      }

      setTimeout(() => {
        if (quizQuestion < quizQuestions.length - 1) {
          quizQuestion++;
          showQuizQuestion(quizQuestion);
          if (quizFeedback) quizFeedback.textContent = "";
          options.forEach(button => button.disabled = false);
        } else {
          quizLocked = true;
          if (quizNext) quizNext.classList.remove("hidden");
        }
      }, 650);
    } else {
      option.classList.add("wrong");
      playTone("wrong");
      if (quizFeedback) {
        quizFeedback.textContent = "NOT QUITE. Try again, Jo. 👀";
        quizFeedback.className = "quiz-feedback wrong";
      }
      setTimeout(() => {
        option.classList.remove("wrong");
        options.forEach(button => button.disabled = false);
      }, 500);
    }
  });
});

// ========================================
// BROWSER BACK / FORWARD NAVIGATION
// ========================================

window.addEventListener("popstate", (event) => {

  if (event.state && event.state.screen) {

    // Restore the previous screen
    // without creating another history entry
    showScreen(event.state.screen, false);

  } else {

    // If there is no saved history state,
    // return to the start screen
    showScreen("screen-start", false);

  }

});

// ========================================
// INITIAL HISTORY STATE
// ========================================

if (state.currentScreen) {

  history.replaceState(
    { screen: state.currentScreen },
    "",
    "#" + state.currentScreen.replace("screen-", "")
  );

}

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


const memoryPhotos = {

  "first-date": [
    {
      image: "assets/images/photos/fd1.HEIC"
    },
    {
      image: "assets/images/photos/fd2.HEIC",
    },
    {
      image: "assets/images/photos/fd3.HEIC"
    },
    {
      image: "assets/images/photos/fd4.HEIC",
    },
    {
      image: "assets/images/photos/fd5.HEIC"
    }
  ],


  "cafes": [
    {
      image: "assets/images/photos/cafe1.jpg"
    },
    {
      image: "assets/images/photos/cafe2.jpg"
    },
    {
      image: "assets/images/photos/cafe3.PNG"
    },
    {
      image: "assets/images/photos/cafe4.PNG"
    },
    {
      image: "assets/images/photos/cafe5.JPG"
    }
  ],


  "food": [
    {
      image: "assets/images/photos/food1.jpg"
    },
    {
      image: "assets/images/photos/food2.jpg"
    },
    {
      image: "assets/images/photos/food3.jpg"
    },
    {
      image: "assets/images/photos/food4.JPG"
    },
    {
      image: "assets/images/photos/food5.JPG"
    },
    {
      image: "assets/images/photos/food6.JPG"
    },
    {
      image: "assets/images/photos/food7.JPG"
    }
  ],


  "rides": [
    {
      image: "assets/images/photos/rides1.jpg"
    },
    {
      image: "assets/images/photos/rides2.jpg"
    }
  ],


  "escapades": [
    {
      image: "assets/images/photos/escp1.jpg"
    },
    {
      image: "assets/images/photos/escp2.jpg"
    },
    {
      image: "assets/images/photos/escp3.HEIC"
    },
    {
      image: "assets/images/photos/escp4.HEIC"
    },
    {
      image: "assets/images/photos/escp5.HEIC"
    }
  ],


  "secret": [
    {
      image: "assets/images/photos/secret1.jpg"
    },{
      image: "assets/images/photos/secret2.jpg"
    },{
      image: "assets/images/photos/secret3.JPG"
    },{
      image: "assets/images/photos/secret4.JPG"
    },{
      image: "assets/images/photos/secret5.JPG"
    },{
      image: "assets/images/photos/secret6.jpg"
    },{
      image: "assets/images/photos/secret7.jpg"
    },{
      image: "assets/images/photos/secret8.jpg"
    },{
      image: "assets/images/photos/secret9.jpg"
    },{
      image: "assets/images/photos/secret10.jpg"
    },{
      image: "assets/images/photos/secret11.jpg"
    },{
      image: "assets/images/photos/secret12.jpg"
    },{
      image: "assets/images/photos/secret13.jpg"
    }
  ]

};


// ========================================
// MEMORY DATA
// ========================================

const memories = {
  "first-date": {
    icon: "🎬",
    label: "FIRST DATE",
    title: "The Beginning",
    text: "Our first little adventure together."
  },

  "cafes": {
    icon: "☕",
    label: "CAFE HOPPING",
    title: "Coffee + You",
    text: "Our little adventures finding cute places to eat and hang out."
  },

  "food": {
    icon: "🍽️",
    label: "FOOD ADVENTURES",
    title: "Food Quest",
    text: "Because apparently every adventure needs food. 😂"
  },

  "rides": {
    icon: "🏍️",
    label: "MOTORCYCLE RIDES",
    title: "Road Quest",
    text: "Even with noo destination in mind. Just us, the motorcycle, and wherever the road takes us."
  },

  "escapades": {
    icon: "🍀",
    label: "ESCAPEDS",
    title: "Our Humble Beginning",
    text: "A spontaneous little adventure that started it all. A little bit of luck, a little bit of fate, and a whole lot of us. ❤️"
  },

  "secret": {
    icon: "🤍",
    label: "SECRET MEMORY",
    title: "A Little Secret",
    text: "No secrets here, just us and our cute moments."
  }
};


// ========================================
// MEMORY MODAL
// ========================================

function openMemoryModal(memoryKey) {
  if (!memoryModal) return;

  const memory = memories[memoryKey];
  if (!memory) return;

  const label = document.getElementById("modal-memory-label");
  const title = document.getElementById("modal-memory-title");
  const copy = document.getElementById("modal-memory-copy");
  const note = document.getElementById("modal-memory-note");

  if (label) label.textContent = memory.label;
  if (title) title.textContent = memory.title;
  if (copy) copy.textContent = memory.text;

  renderMemoryPhotos(memoryKey);

  if (note) {
    note.textContent = "Tap a photo heading to open or close it. ❤️";
  }

  memoryModal.hidden = false;
  memoryModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  playTone("page");
}

let selectedMemory = "first-date";
const memoryModal = document.getElementById("memory-modal");

function renderMemoryPhotos(memoryKey) {
  const gallery = document.querySelector("#memory-gallery");
  if (!gallery) return;

  gallery.innerHTML = "";

  const photos = memoryPhotos[memoryKey] || [];

  if (!photos.length) {
    gallery.innerHTML = `
      <div class="memory-carousel-empty">
        📸 More memories coming soon. ❤️
      </div>
    `;
    return;
  }

  let currentIndex = 0;

  const carousel = document.createElement("div");
  carousel.className = "memory-carousel";

  const viewport = document.createElement("div");
  viewport.className = "memory-carousel-viewport";

  const track = document.createElement("div");
  track.className = "memory-carousel-track";

  photos.forEach((photo, index) => {
    const slide = document.createElement("article");
    slide.className = "memory-photo-slide";
    slide.setAttribute("aria-hidden", index === 0 ? "false" : "true");

    slide.innerHTML = `
      <div class="memory-photo-frame">
        <img
          src="${photo.image}"
          alt="${photo.caption || `Memory photo ${index + 1}` }"
          loading="${index === 0 ? "eager" : "lazy"}"
        >
      </div>
      
    `;

    track.appendChild(slide);
  });

  viewport.appendChild(track);

  const controls = document.createElement("div");
  controls.className = "memory-carousel-controls";

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.className = "memory-carousel-arrow";
  previousButton.setAttribute("aria-label", "Previous photo");
  previousButton.innerHTML = "‹";

  const dots = document.createElement("div");
  dots.className = "memory-carousel-dots";
  dots.setAttribute("role", "tablist");
  dots.setAttribute("aria-label", "Memory photos");

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "memory-carousel-arrow";
  nextButton.setAttribute("aria-label", "Next photo");
  nextButton.innerHTML = "›";

  photos.forEach((photo, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "memory-carousel-dot" + (index === 0 ? " active" : "");
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Show photo ${index + 1}`);
    dot.setAttribute("aria-selected", index === 0 ? "true" : "false");
    dots.appendChild(dot);

    dot.addEventListener("click", () => {
      goToSlide(index);
      playTone("click");
    });
  });

  controls.append(previousButton, dots, nextButton);
  carousel.append(viewport, controls);
  gallery.appendChild(carousel);

  const updateCarousel = () => {
    track.style.transform = `translate3d(-${currentIndex * 100}%, 0, 0)`;

    track.querySelectorAll(".memory-photo-slide").forEach((slide, index) => {
      slide.setAttribute("aria-hidden", index === currentIndex ? "false" : "true");
    });

    dots.querySelectorAll(".memory-carousel-dot").forEach((dot, index) => {
      const active = index === currentIndex;
      dot.classList.toggle("active", active);
      dot.setAttribute("aria-selected", active ? "true" : "false");
    });

    previousButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === photos.length - 1;
  };

  const goToSlide = (index) => {
    currentIndex = Math.max(0, Math.min(index, photos.length - 1));
    updateCarousel();
  };

  previousButton.addEventListener("click", () => {
    goToSlide(currentIndex - 1);
    playTone("click");
  });

  nextButton.addEventListener("click", () => {
    goToSlide(currentIndex + 1);
    playTone("click");
  });

  let touchStartX = 0;
  let touchStartY = 0;
  let touchActive = false;

  viewport.addEventListener("touchstart", event => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchActive = true;
  }, { passive: true });

  viewport.addEventListener("touchend", event => {
    if (!touchActive) return;
    touchActive = false;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    if (deltaX < 0 && currentIndex < photos.length - 1) {
      goToSlide(currentIndex + 1);
      playTone("click");
    } else if (deltaX > 0 && currentIndex > 0) {
      goToSlide(currentIndex - 1);
      playTone("click");
    }
  }, { passive: true });

  updateCarousel();
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

document.getElementById("memory-card")?.addEventListener("click", () => {
  openMemoryModal(selectedMemory);
});
document.querySelectorAll("[data-close-memory]").forEach(el => el.addEventListener("click", closeMemoryModal));
document.addEventListener("keydown", event => { if (event.key === "Escape") closeMemoryModal(); });

let joTaps = 0;
let joTapTimer = null;
const secretToast = document.getElementById("secret-toast");
document.getElementById("jo-secret")?.addEventListener("click", () => {
  joTaps++;
  clearTimeout(joTapTimer);
  joTapTimer = setTimeout(() => { joTaps = 0; }, 1300);
  if (joTaps >= 2) {
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

document.getElementById("restart-")?.addEventListener("click", () => {
  quizQuestion = 0;
  quizLocked = false;
  if (quizNext) quizNext.classList.add("hidden");
  if (quizFeedback) quizFeedback.textContent = "";
  showQuizQuestion(0);
  document.querySelectorAll(".quiz-option").forEach(button => {
    button.disabled = false;
    button.classList.remove("correct", "wrong");
  });
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
