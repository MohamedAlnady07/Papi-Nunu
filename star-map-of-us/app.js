/**
 * ============================================================================
 * THE STAR MAP OF US — INTERACTIVE STORYTELLING CONTROLLER
 * ============================================================================
 */

(function () {
  var CONFIG_STORAGE_KEY = "starMap_customConfig_v3";
  var PROGRESS_STORAGE_KEY = "starMap_progress_v1";

  var BASE_CONFIG = deepClone(window.STAR_MAP_CONFIG || {});
  var config = loadMergedConfig();
  var progress = loadProgress();

  var state = {
    act: "curtain", // "curtain" | "sky" | "finale"
    activeStarId: null,
    justCompletedConstellation: false,
    whisperIdx: 0,
    studioOpen: false,
    studioTab: "basics",
    studioStarIdx: 0,
    timerInterval: null,
    toastTimer: null,
    lastFocusedEl: null
  };

  // DOM References
  var canvas = document.getElementById("sky-canvas");
  var whisperLayer = document.getElementById("whisper-layer");
  var hotspotLayer = document.getElementById("hotspot-layer");
  var starHotspotsEl = document.getElementById("star-hotspots");
  var wishHotspotsEl = document.getElementById("wish-hotspots");

  var hudTop = document.getElementById("sky-hud-top");
  var hudDedication = document.getElementById("hud-dedication");
  var btnReadLetter = document.getElementById("btn-read-letter");
  var btnSound = document.getElementById("btn-sound");

  var hudBottom = document.getElementById("sky-hud-bottom");
  var progressTrack = document.getElementById("progress-track");
  var hudHint = document.getElementById("hud-hint");

  var completionBanner = document.getElementById("completion-banner");
  var btnOpenFinale = document.getElementById("btn-open-finale");

  var curtain = document.getElementById("curtain");
  var curtainDedication = document.getElementById("curtain-dedication");
  var curtainHeadline = document.getElementById("curtain-headline");
  var curtainSubtext = document.getElementById("curtain-subtext");
  var btnEnterSky = document.getElementById("btn-enter-sky");

  var noteBackdrop = document.getElementById("note-backdrop");
  var noteBody = document.getElementById("note-body");
  var noteRoman = document.getElementById("note-roman");
  var noteLabel = document.getElementById("note-label");
  var noteTitle = document.getElementById("note-title");
  var noteParagraphs = document.getElementById("note-paragraphs");
  var noteFigure = document.getElementById("note-figure");
  var notePhoto = document.getElementById("note-photo");
  var noteCaption = document.getElementById("note-caption");
  var btnCloseNote = document.getElementById("btn-close-note");
  var btnPrevStar = document.getElementById("btn-prev-star");
  var btnNextStar = document.getElementById("btn-next-star");

  var letterBackdrop = document.getElementById("letter-backdrop");
  var letterScroll = document.getElementById("letter-scroll");
  var letterEyebrow = document.getElementById("letter-eyebrow");
  var letterTitle = document.getElementById("letter-title");
  var letterSalutation = document.getElementById("letter-salutation");
  var letterParagraphs = document.getElementById("letter-paragraphs");
  var letterClosing = document.getElementById("letter-closing");
  var letterSignature = document.getElementById("letter-signature");
  var btnCloseLetter = document.getElementById("btn-close-letter");

  var timeTogetherEl = document.getElementById("time-together");
  var ttDays = document.getElementById("tt-days");
  var ttHours = document.getElementById("tt-hours");
  var ttMinutes = document.getElementById("tt-minutes");
  var ttSeconds = document.getElementById("tt-seconds");

  var wishForm = document.getElementById("wish-form");
  var wishInput = document.getElementById("wish-input");
  var wishPopover = document.getElementById("wish-popover");
  var wishPopoverText = document.getElementById("wish-popover-text");
  var btnCloseWish = document.getElementById("btn-close-wish");
  var skyToast = document.getElementById("sky-toast");

  var studioDrawer = document.getElementById("studio-drawer");
  var studioBody = document.getElementById("studio-body");
  var btnCloseStudio = document.getElementById("btn-close-studio");
  var studioTabButtons = document.querySelectorAll("[data-studio-tab]");
  var studioPreviewBtn = document.getElementById("studio-preview-finale");
  var studioResetJourneyBtn = document.getElementById("studio-reset-journey");
  var studioResetConfigBtn = document.getElementById("studio-reset-config");
  var studioDownloadBtn = document.getElementById("studio-download");

  // Helpers
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function mergeDeep(base, override) {
    if (!override || typeof override !== "object") return deepClone(base);
    var out = Array.isArray(base) ? [] : {};
    var keys = Object.keys(base);
    for (var i = 0; i < keys.length; i += 1) {
      var k = keys[i];
      if (Array.isArray(base[k])) {
        out[k] = Array.isArray(override[k])
          ? deepClone(override[k])
          : deepClone(base[k]);
      } else if (base[k] && typeof base[k] === "object") {
        out[k] = mergeDeep(base[k], override[k]);
      } else {
        out[k] = override[k] !== undefined ? override[k] : base[k];
      }
    }
    return out;
  }

  function loadMergedConfig() {
    try {
      var raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
      if (raw) {
        return mergeDeep(BASE_CONFIG, JSON.parse(raw));
      }
    } catch (err) {
      // Ignore storage errors
    }
    return deepClone(BASE_CONFIG);
  }

  function saveCustomConfig() {
    try {
      window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (err) {
      // Ignore storage errors
    }
  }

  function loadProgress() {
    var fallback = {
      discoveredIds: [],
      wishes: [],
      muted: false
    };
    try {
      var raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        return {
          discoveredIds: [],
          wishes: Array.isArray(parsed.wishes) ? parsed.wishes : [],
          muted: Boolean(parsed.muted)
        };
      }
    } catch (err) {
      // Ignore
    }
    return fallback;
  }

  function saveProgress() {
    try {
      window.localStorage.setItem(
        PROGRESS_STORAGE_KEY,
        JSON.stringify({
          wishes: progress.wishes,
          muted: progress.muted
        })
      );
    } catch (err) {
      // Ignore
    }
  }

  function fillTokens(str) {
    var text = typeof str === "string" ? str : "";
    var her = (config.herName || "My Love").trim() || "My Love";
    var yours = (config.yourName || "Yours Forever").trim() || "Yours Forever";
    return text
      .replace(/\{\{\s*herName\s*\}\}/g, her)
      .replace(/\{\{\s*yourName\s*\}\}/g, yours);
  }

  function getDiscoveredSet() {
    return new Set(progress.discoveredIds);
  }

  function getStarById(id) {
    var stars = config.stars || [];
    for (var i = 0; i < stars.length; i += 1) {
      if (stars[i].id === id) return stars[i];
    }
    return stars[0];
  }

  function getNextSuggestedId() {
    var set = getDiscoveredSet();
    for (var id = 1; id <= 7; id += 1) {
      if (!set.has(id)) return id;
    }
    return null;
  }

  // Initialize Sky Canvas
  var sky = new window.StarSky(canvas, {
    onLayout: function (starPositions, wishPositions) {
      positionHotspots(starPositions, wishPositions);
    }
  });

  // Reduced Motion Observer
  var motionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;
  if (motionQuery) {
    sky.setReducedMotion(motionQuery.matches);
    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", function (ev) {
        sky.setReducedMotion(ev.matches);
      });
    }
  }

  // Apply Theme & Initial Render
  function applyTheme(themeName) {
    var allowed = ["midnight-gold", "velvet-rose", "deep-aurora"];
    var chosen = allowed.indexOf(themeName) !== -1 ? themeName : "midnight-gold";
    document.documentElement.setAttribute("data-theme", chosen);
    sky.setThemeColors();
  }

  function renderTextFromConfig() {
    applyTheme(config.theme);
    var her = (config.herName || "My Love").trim() || "My Love";
    document.title = "The Star Map of Us — For " + her;

    hudDedication.textContent = "For " + her;
    curtainDedication.textContent = fillTokens(config.opening.dedication);
    curtainHeadline.textContent = fillTokens(config.opening.headline);
    curtainSubtext.textContent = fillTokens(config.opening.subtext);
    btnEnterSky.textContent = fillTokens(config.opening.cta);

    letterEyebrow.textContent = fillTokens(config.letter.eyebrow);
    letterTitle.textContent = fillTokens(config.letter.title);
    letterSalutation.textContent = fillTokens(config.letter.salutation);
    letterClosing.textContent = fillTokens(config.letter.closing);
    letterSignature.textContent = fillTokens("{{yourName}}");

    letterParagraphs.innerHTML = "";
    var paras = config.letter.paragraphs || [];
    for (var i = 0; i < paras.length; i += 1) {
      var p = document.createElement("p");
      p.textContent = fillTokens(paras[i]);
      letterParagraphs.appendChild(p);
    }

    renderStarHotspots();
    renderWishHotspots();
    renderProgressTrack();
    updateHudState();
  }

  function renderStarHotspots() {
    starHotspotsEl.innerHTML = "";
    var stars = config.stars || [];
    var discoveredSet = getDiscoveredSet();
    var nextId = getNextSuggestedId();

    for (var i = 0; i < stars.length; i += 1) {
      (function (star) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "star-hotspot";
        btn.dataset.starId = String(star.id);
        btn.setAttribute(
          "aria-label",
          "Star " + star.roman + ": " + fillTokens(star.title)
        );
        if (discoveredSet.has(star.id)) {
          btn.classList.add("is-discovered");
        } else if (star.id === nextId) {
          btn.classList.add("is-suggested");
        }

        var roman = document.createElement("span");
        roman.className = "star-hotspot__roman";
        roman.textContent = star.roman;

        var tip = document.createElement("span");
        tip.className = "star-hotspot__tooltip";
        tip.textContent = discoveredSet.has(star.id)
          ? fillTokens(star.title)
          : "Star " + star.roman;

        btn.appendChild(roman);
        btn.appendChild(tip);

        btn.addEventListener("mouseenter", function () {
          sky.setHoveredStar(star.id);
        });
        btn.addEventListener("mouseleave", function () {
          sky.setHoveredStar(null);
        });
        btn.addEventListener("focus", function () {
          sky.setHoveredStar(star.id);
        });
        btn.addEventListener("blur", function () {
          sky.setHoveredStar(null);
        });
        btn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          openStar(star.id);
        });

        starHotspotsEl.appendChild(btn);
      })(stars[i]);
    }

    positionHotspots(sky.getStarScreenPositions(), sky.getWishScreenPositions());
  }

  function renderWishHotspots() {
    wishHotspotsEl.innerHTML = "";
    var wishes = progress.wishes || [];
    for (var i = 0; i < wishes.length; i += 1) {
      (function (wish) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "wish-star-btn";
        btn.dataset.wishId = wish.id;
        btn.setAttribute("aria-label", "Saved wish: " + wish.text);

        var tag = document.createElement("span");
        tag.className = "wish-star-btn__tag";
        tag.textContent = "A Wish";
        btn.appendChild(tag);

        btn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          window.StarAudio.unlock();
          window.StarAudio.playWhisper();
          showWishPopover(wish.text);
        });

        wishHotspotsEl.appendChild(btn);
      })(wishes[i]);
    }

    positionHotspots(sky.getStarScreenPositions(), sky.getWishScreenPositions());
  }

  function positionHotspots(starPositions, wishPositions) {
    var starBtns = starHotspotsEl.querySelectorAll(".star-hotspot");
    for (var i = 0; i < starBtns.length; i += 1) {
      var sid = parseInt(starBtns[i].dataset.starId, 10);
      var pos = starPositions[sid];
      if (pos) {
        starBtns[i].style.left = pos.x + "px";
        starBtns[i].style.top = pos.y + "px";
      }
    }

    var wishBtns = wishHotspotsEl.querySelectorAll(".wish-star-btn");
    for (var w = 0; w < wishBtns.length; w += 1) {
      var wPos = wishPositions[w];
      if (wPos) {
        wishBtns[w].style.left = wPos.x + "px";
        wishBtns[w].style.top = wPos.y + "px";
      }
    }
  }

  function renderProgressTrack() {
    progressTrack.innerHTML = "";
    var stars = config.stars || [];
    var discoveredSet = getDiscoveredSet();
    for (var i = 0; i < stars.length; i += 1) {
      (function (star) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "progress-dot";
        dot.setAttribute(
          "aria-label",
          "Open star " + star.roman + ": " + fillTokens(star.title)
        );
        if (discoveredSet.has(star.id)) {
          dot.classList.add("is-discovered");
        }
        if (state.activeStarId === star.id) {
          dot.classList.add("is-active");
        }
        dot.addEventListener("click", function (ev) {
          ev.stopPropagation();
          openStar(star.id);
        });
        progressTrack.appendChild(dot);
      })(stars[i]);
    }
  }

  function updateHudState() {
    var count = progress.discoveredIds.length;
    var complete = count >= 7;

    btnReadLetter.hidden = !complete;
    btnSound.textContent = window.StarAudio.isMuted() ? "Sound: Off" : "Sound: On";
    btnSound.setAttribute("aria-pressed", String(window.StarAudio.isMuted()));

    if (complete) {
      hudHint.textContent =
        "All 7 stars lit — tap any star to revisit, or tap open sky for a whisper";
    } else if (count === 0) {
      hudHint.textContent =
        "Tap Star I to begin connecting our sky (0 of 7 lit)";
    } else {
      hudHint.textContent =
        count + " of 7 stars lit — keep following the light";
    }

    sky.setDiscovered(getDiscoveredSet());
    sky.setActiveStar(state.activeStarId);
    sky.setCompleted(complete);
  }

  function enterSky() {
    window.StarAudio.unlock();
    state.act = "sky";
    sky.setAct("sky");
    curtain.classList.add("is-exited");
    hotspotLayer.classList.remove("is-dimmed");
    hudTop.classList.remove("is-hidden");
    hudBottom.classList.remove("is-hidden");
    window.StarAudio.playWhisper();

    if (progress.discoveredIds.length >= 7) {
      completionBanner.hidden = false;
    }
  }

  function openStar(starId) {
    window.StarAudio.unlock();
    var star = getStarById(starId);
    if (!star) return;

    var discoveredSet = getDiscoveredSet();
    var wasComplete = discoveredSet.size >= 7;
    var isNewDiscovery = !discoveredSet.has(star.id);

    if (isNewDiscovery) {
      progress.discoveredIds.push(star.id);
      saveProgress();
      sky.burstAtStar(star.id, false);
    }

    window.StarAudio.playStar(star.id - 1);

    if (!wasComplete && progress.discoveredIds.length >= 7) {
      state.justCompletedConstellation = true;
    }

    state.activeStarId = star.id;
    renderStarHotspots();
    renderProgressTrack();
    updateHudState();

    // Populate Note Sheet
    noteRoman.textContent = "Star " + star.roman;
    noteLabel.textContent = fillTokens(star.label);
    noteTitle.textContent = fillTokens(star.title);
    noteParagraphs.innerHTML = "";

    var msgs = Array.isArray(star.message) ? star.message : [String(star.message || "")];
    for (var i = 0; i < msgs.length; i += 1) {
      var p = document.createElement("p");
      p.textContent = fillTokens(msgs[i]);
      noteParagraphs.appendChild(p);
    }

    var photoUrl = (star.photo || "").trim();
    if (photoUrl) {
      notePhoto.onerror = function () {
        noteFigure.hidden = true;
      };
      notePhoto.src = photoUrl;
      notePhoto.alt = fillTokens(star.photoCaption || star.title);
      noteCaption.textContent = fillTokens(star.photoCaption || "");
      noteCaption.hidden = !star.photoCaption;
      noteFigure.hidden = false;
    } else {
      noteFigure.hidden = true;
      notePhoto.removeAttribute("src");
    }

    var stars = config.stars || [];
    var idx = stars.findIndex(function (s) {
      return s.id === star.id;
    });
    btnPrevStar.disabled = idx <= 0;
    btnPrevStar.style.opacity = idx <= 0 ? "0.38" : "1";

    if (idx >= stars.length - 1) {
      btnNextStar.textContent =
        progress.discoveredIds.length >= 7 ? "Finish & Light Sky" : "Star I";
    } else {
      btnNextStar.textContent = "Next Star";
    }

    completionBanner.hidden = true;
    wishPopover.hidden = true;
    state.lastFocusedEl = document.activeElement;
    noteBackdrop.hidden = false;
    noteBody.scrollTop = 0;
    btnCloseNote.focus();
  }

  function closeStarNote() {
    noteBackdrop.hidden = true;
    state.activeStarId = null;
    sky.setActiveStar(null);
    renderProgressTrack();

    if (state.justCompletedConstellation) {
      state.justCompletedConstellation = false;
      sky.setCompleted(true);
      sky.burstCompletion();
      window.StarAudio.playConstellationComplete();
      completionBanner.hidden = false;
    } else if (progress.discoveredIds.length >= 7 && state.act === "sky") {
      completionBanner.hidden = false;
    }

    if (state.lastFocusedEl && typeof state.lastFocusedEl.focus === "function") {
      state.lastFocusedEl.focus();
    }
  }

  function openFinaleLetter() {
    window.StarAudio.unlock();
    completionBanner.hidden = true;
    noteBackdrop.hidden = true;
    wishPopover.hidden = true;
    state.activeStarId = null;
    state.act = "finale";
    sky.setActiveStar(null);

    updateTimeTogetherCounter();
    letterBackdrop.hidden = false;
    letterScroll.scrollTop = 0;
    btnCloseLetter.focus();
  }

  function closeFinaleLetter() {
    letterBackdrop.hidden = true;
    state.act = "sky";
    stopTimeTogetherCounter();
    if (progress.discoveredIds.length >= 7) {
      completionBanner.hidden = false;
    }
  }

  function updateTimeTogetherCounter() {
    stopTimeTogetherCounter();
    var rawDate = (config.specialDate || "").trim();
    var match = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      timeTogetherEl.hidden = true;
      return;
    }

    var start = new Date(
      parseInt(match[1], 10),
      parseInt(match[2], 10) - 1,
      parseInt(match[3], 10),
      0,
      0,
      0
    );

    if (isNaN(start.getTime()) || Date.now() - start.getTime() < 0) {
      timeTogetherEl.hidden = true;
      return;
    }

    timeTogetherEl.hidden = false;

    function tick() {
      var diffSec = Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000));
      var days = Math.floor(diffSec / 86400);
      var hours = Math.floor((diffSec % 86400) / 3600);
      var minutes = Math.floor((diffSec % 3600) / 60);
      var seconds = diffSec % 60;

      ttDays.textContent = String(days);
      ttHours.textContent = String(hours).padStart(2, "0");
      ttMinutes.textContent = String(minutes).padStart(2, "0");
      ttSeconds.textContent = String(seconds).padStart(2, "0");
    }

    tick();
    state.timerInterval = window.setInterval(tick, 1000);
  }

  function stopTimeTogetherCounter() {
    if (state.timerInterval) {
      window.clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  function spawnSkyWhisper(clientX, clientY) {
    var list = config.skyWhispers || [];
    if (!list.length) return;
    var msg = fillTokens(list[state.whisperIdx % list.length]);
    state.whisperIdx += 1;

    var x = Math.max(96, Math.min(window.innerWidth - 96, clientX));
    var y = Math.max(88, Math.min(window.innerHeight - 120, clientY));

    var el = document.createElement("span");
    el.className = "sky-whisper";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.textContent = msg;
    whisperLayer.appendChild(el);

    window.setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2500);
  }

  function showWishPopover(text) {
    wishPopoverText.textContent = "\u201C" + text + "\u201D";
    wishPopover.hidden = false;
  }

  function showToast(msg) {
    skyToast.textContent = msg;
    skyToast.hidden = false;
    if (state.toastTimer) {
      window.clearTimeout(state.toastTimer);
    }
    state.toastTimer = window.setTimeout(function () {
      skyToast.hidden = true;
    }, 3400);
  }

  function createWishPosition(index) {
    var leftSide = index % 2 === 0;
    var col = Math.floor(index / 2) % 4;
    var xNorm = leftSide
      ? 0.14 + col * 0.05 + Math.random() * 0.03
      : 0.86 - col * 0.05 - Math.random() * 0.03;
    var yNorm = 0.16 + ((index * 0.065) % 0.18) + Math.random() * 0.03;
    return {
      xNorm: Math.max(0.1, Math.min(0.9, xNorm)),
      yNorm: Math.max(0.14, Math.min(0.36, yNorm))
    };
  }

  // Event Listeners
  btnEnterSky.addEventListener("click", enterSky);

  btnSound.addEventListener("click", function (ev) {
    ev.stopPropagation();
    window.StarAudio.unlock();
    var nextMuted = !window.StarAudio.isMuted();
    window.StarAudio.setMuted(nextMuted);
    progress.muted = nextMuted;
    saveProgress();
    updateHudState();
  });

  btnReadLetter.addEventListener("click", function (ev) {
    ev.stopPropagation();
    openFinaleLetter();
  });

  btnOpenFinale.addEventListener("click", function (ev) {
    ev.stopPropagation();
    openFinaleLetter();
  });

  btnCloseNote.addEventListener("click", closeStarNote);
  noteBackdrop.addEventListener("click", function (ev) {
    if (ev.target === noteBackdrop) closeStarNote();
  });

  btnPrevStar.addEventListener("click", function () {
    var stars = config.stars || [];
    var idx = stars.findIndex(function (s) {
      return s.id === state.activeStarId;
    });
    if (idx > 0) {
      openStar(stars[idx - 1].id);
    }
  });

  btnNextStar.addEventListener("click", function () {
    var stars = config.stars || [];
    var idx = stars.findIndex(function (s) {
      return s.id === state.activeStarId;
    });
    if (idx >= 0 && idx < stars.length - 1) {
      openStar(stars[idx + 1].id);
    } else if (progress.discoveredIds.length >= 7) {
      closeStarNote();
    } else {
      openStar(stars[0].id);
    }
  });

  btnCloseLetter.addEventListener("click", closeFinaleLetter);
  letterBackdrop.addEventListener("click", function (ev) {
    if (ev.target === letterBackdrop) closeFinaleLetter();
  });

  btnCloseWish.addEventListener("click", function () {
    wishPopover.hidden = true;
  });

  wishForm.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var text = wishInput.value.trim();
    if (!text) return;

    var pos = createWishPosition(progress.wishes.length);
    var wishObj = {
      id: "wish_" + Date.now(),
      text: text,
      xNorm: pos.xNorm,
      yNorm: pos.yNorm,
      createdAt: new Date().toISOString()
    };

    progress.wishes.push(wishObj);
    saveProgress();
    wishInput.value = "";

    closeFinaleLetter();
    completionBanner.hidden = true;
    sky.launchWishStar(wishObj);
    renderWishHotspots();
    window.StarAudio.unlock();
    window.StarAudio.playWish();
    showToast("Your wish now shines in our sky");
  });

  canvas.addEventListener("click", function (ev) {
    if (state.act !== "sky") return;
    if (!noteBackdrop.hidden || !letterBackdrop.hidden) return;
    wishPopover.hidden = true;
    window.StarAudio.unlock();
    window.StarAudio.playWhisper();
    sky.spawnEmptyTap(ev.clientX, ev.clientY);
    spawnSkyWhisper(ev.clientX, ev.clientY);
  });

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") {
      if (!noteBackdrop.hidden) {
        closeStarNote();
        return;
      }
      if (!letterBackdrop.hidden) {
        closeFinaleLetter();
        return;
      }
      if (!wishPopover.hidden) {
        wishPopover.hidden = true;
        return;
      }
      if (state.studioOpen) {
        toggleStudio(false);
        return;
      }
    }

    var tag = document.activeElement ? document.activeElement.tagName : "";
    var typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    if (!typing && ev.shiftKey && (ev.key === "E" || ev.key === "e")) {
      ev.preventDefault();
      toggleStudio(!state.studioOpen);
    }
  });

  // ========================================================================
  // HIDDEN PERSONALIZATION STUDIO (?edit=1 or Shift + E)
  // ========================================================================

  function toggleStudio(open) {
    state.studioOpen = Boolean(open);
    studioDrawer.setAttribute("data-open", String(state.studioOpen));
    if (state.studioOpen) {
      renderStudioBody();
    }
  }

  function makeField(labelText, inputEl) {
    var wrap = document.createElement("div");
    wrap.className = "studio-field";
    var lbl = document.createElement("label");
    lbl.textContent = labelText;
    wrap.appendChild(lbl);
    wrap.appendChild(inputEl);
    return wrap;
  }

  function renderStudioBody() {
    studioBody.innerHTML = "";

    if (state.studioTab === "basics") {
      var herInput = document.createElement("input");
      herInput.className = "studio-input";
      herInput.value = config.herName || "";
      herInput.addEventListener("input", function () {
        config.herName = herInput.value;
        saveCustomConfig();
        renderTextFromConfig();
      });
      studioBody.appendChild(makeField("Her Name", herInput));

      var yourInput = document.createElement("input");
      yourInput.className = "studio-input";
      yourInput.value = config.yourName || "";
      yourInput.addEventListener("input", function () {
        config.yourName = yourInput.value;
        saveCustomConfig();
        renderTextFromConfig();
      });
      studioBody.appendChild(makeField("Your Name (Signature)", yourInput));

      var dateInput = document.createElement("input");
      dateInput.className = "studio-input";
      dateInput.type = "date";
      dateInput.value = config.specialDate || "";
      dateInput.addEventListener("input", function () {
        config.specialDate = dateInput.value;
        saveCustomConfig();
        if (!letterBackdrop.hidden) updateTimeTogetherCounter();
      });
      studioBody.appendChild(
        makeField("Special Date (Optional Counter)", dateInput)
      );

      // Theme Swatches
      var swatchWrap = document.createElement("div");
      swatchWrap.className = "studio-field";
      var swatchLbl = document.createElement("label");
      swatchLbl.textContent = "Sky Atmosphere";
      swatchWrap.appendChild(swatchLbl);

      var swatchGrid = document.createElement("div");
      swatchGrid.className = "theme-swatches";
      var themes = [
        { id: "midnight-gold", label: "Midnight", dot: "#E9C476" },
        { id: "velvet-rose", label: "Velvet Rose", dot: "#E8B4A8" },
        { id: "deep-aurora", label: "Aurora", dot: "#8AC4BC" }
      ];
      themes.forEach(function (t) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "theme-swatch" + (config.theme === t.id ? " is-active" : "");
        var dot = document.createElement("span");
        dot.className = "theme-swatch__dot";
        dot.style.background = t.dot;
        btn.appendChild(dot);
        btn.appendChild(document.createTextNode(t.label));
        btn.addEventListener("click", function () {
          config.theme = t.id;
          saveCustomConfig();
          renderTextFromConfig();
          renderStudioBody();
        });
        swatchGrid.appendChild(btn);
      });
      swatchWrap.appendChild(swatchGrid);
      studioBody.appendChild(swatchWrap);

      var dedInput = document.createElement("input");
      dedInput.className = "studio-input";
      dedInput.value = config.opening.dedication || "";
      dedInput.addEventListener("input", function () {
        config.opening.dedication = dedInput.value;
        saveCustomConfig();
        renderTextFromConfig();
      });
      studioBody.appendChild(makeField("Opening Dedication", dedInput));

      var headInput = document.createElement("textarea");
      headInput.className = "studio-textarea";
      headInput.value = config.opening.headline || "";
      headInput.addEventListener("input", function () {
        config.opening.headline = headInput.value;
        saveCustomConfig();
        renderTextFromConfig();
      });
      studioBody.appendChild(makeField("Opening Headline", headInput));

      var subInput = document.createElement("textarea");
      subInput.className = "studio-textarea";
      subInput.value = config.opening.subtext || "";
      subInput.addEventListener("input", function () {
        config.opening.subtext = subInput.value;
        saveCustomConfig();
        renderTextFromConfig();
      });
      studioBody.appendChild(makeField("Opening Subtext", subInput));
    } else if (state.studioTab === "stars") {
      var starSelect = document.createElement("select");
      starSelect.className = "studio-select";
      config.stars.forEach(function (s, idx) {
        var opt = document.createElement("option");
        opt.value = String(idx);
        opt.textContent = "Star " + s.roman + " — " + fillTokens(s.title);
        if (idx === state.studioStarIdx) opt.selected = true;
        starSelect.appendChild(opt);
      });
      starSelect.addEventListener("change", function () {
        state.studioStarIdx = parseInt(starSelect.value, 10) || 0;
        renderStudioBody();
      });
      studioBody.appendChild(makeField("Select Star to Edit", starSelect));

      var currentStar = config.stars[state.studioStarIdx] || config.stars[0];

      var titleIn = document.createElement("input");
      titleIn.className = "studio-input";
      titleIn.value = currentStar.title || "";
      titleIn.addEventListener("input", function () {
        currentStar.title = titleIn.value;
        saveCustomConfig();
        renderTextFromConfig();
      });
      studioBody.appendChild(makeField("Star Title", titleIn));

      var labelIn = document.createElement("input");
      labelIn.className = "studio-input";
      labelIn.value = currentStar.label || "";
      labelIn.addEventListener("input", function () {
        currentStar.label = labelIn.value;
        saveCustomConfig();
      });
      studioBody.appendChild(makeField("Subtitle", labelIn));

      var msgIn = document.createElement("textarea");
      msgIn.className = "studio-textarea";
      msgIn.style.minHeight = "130px";
      msgIn.value = (currentStar.message || []).join("\n\n");
      msgIn.addEventListener("input", function () {
        currentStar.message = msgIn.value
          .split(/\n\s*\n/)
          .map(function (s) {
            return s.trim();
          })
          .filter(Boolean);
        saveCustomConfig();
      });
      studioBody.appendChild(
        makeField("Message (blank line separates paragraphs)", msgIn)
      );

      var photoIn = document.createElement("input");
      photoIn.className = "studio-input";
      photoIn.placeholder = "e.g. photos/us.jpg";
      photoIn.value = currentStar.photo || "";
      photoIn.addEventListener("input", function () {
        currentStar.photo = photoIn.value;
        saveCustomConfig();
      });
      studioBody.appendChild(makeField("Optional Photo Path", photoIn));

      var capIn = document.createElement("input");
      capIn.className = "studio-input";
      capIn.value = currentStar.photoCaption || "";
      capIn.addEventListener("input", function () {
        currentStar.photoCaption = capIn.value;
        saveCustomConfig();
      });
      studioBody.appendChild(makeField("Optional Photo Caption", capIn));
    } else if (state.studioTab === "letter") {
      var lTitle = document.createElement("input");
      lTitle.className = "studio-input";
      lTitle.value = config.letter.title || "";
      lTitle.addEventListener("input", function () {
        config.letter.title = lTitle.value;
        saveCustomConfig();
        renderTextFromConfig();
      });
      studioBody.appendChild(makeField("Letter Title", lTitle));

      var lSal = document.createElement("input");
      lSal.className = "studio-input";
      lSal.value = config.letter.salutation || "";
      lSal.addEventListener("input", function () {
        config.letter.salutation = lSal.value;
        saveCustomConfig();
        renderTextFromConfig();
      });
      studioBody.appendChild(makeField("Salutation", lSal));

      var lParas = document.createElement("textarea");
      lParas.className = "studio-textarea";
      lParas.style.minHeight = "155px";
      lParas.value = (config.letter.paragraphs || []).join("\n\n");
      lParas.addEventListener("input", function () {
        config.letter.paragraphs = lParas.value
          .split(/\n\s*\n/)
          .map(function (s) {
            return s.trim();
          })
          .filter(Boolean);
        saveCustomConfig();
        renderTextFromConfig();
      });
      studioBody.appendChild(
        makeField("Letter Paragraphs (blank line between)", lParas)
      );

      var lClose = document.createElement("input");
      lClose.className = "studio-input";
      lClose.value = config.letter.closing || "";
      lClose.addEventListener("input", function () {
        config.letter.closing = lClose.value;
        saveCustomConfig();
        renderTextFromConfig();
      });
      studioBody.appendChild(makeField("Closing Line", lClose));

      var wLines = document.createElement("textarea");
      wLines.className = "studio-textarea";
      wLines.value = (config.skyWhispers || []).join("\n");
      wLines.addEventListener("input", function () {
        config.skyWhispers = wLines.value
          .split(/\n/)
          .map(function (s) {
            return s.trim();
          })
          .filter(Boolean);
        saveCustomConfig();
      });
      studioBody.appendChild(makeField("Sky Whispers (one per line)", wLines));
    }
  }

  btnCloseStudio.addEventListener("click", function () {
    toggleStudio(false);
  });

  for (var t = 0; t < studioTabButtons.length; t += 1) {
    (function (tabBtn) {
      tabBtn.addEventListener("click", function () {
        state.studioTab = tabBtn.dataset.studioTab;
        for (var j = 0; j < studioTabButtons.length; j += 1) {
          var active = studioTabButtons[j] === tabBtn;
          studioTabButtons[j].classList.toggle("is-active", active);
          studioTabButtons[j].setAttribute("aria-selected", String(active));
        }
        renderStudioBody();
      });
    })(studioTabButtons[t]);
  }

  studioPreviewBtn.addEventListener("click", function () {
    if (state.act === "curtain") enterSky();
    progress.discoveredIds = [1, 2, 3, 4, 5, 6, 7];
    saveProgress();
    renderStarHotspots();
    renderProgressTrack();
    updateHudState();
    openFinaleLetter();
  });

  studioResetJourneyBtn.addEventListener("click", function () {
    progress.discoveredIds = [];
    progress.wishes = [];
    saveProgress();
    state.activeStarId = null;
    state.justCompletedConstellation = false;
    state.act = "curtain";
    sky.setAct("curtain");
    curtain.classList.remove("is-exited");
    hotspotLayer.classList.add("is-dimmed");
    hudTop.classList.add("is-hidden");
    hudBottom.classList.add("is-hidden");
    noteBackdrop.hidden = true;
    letterBackdrop.hidden = true;
    completionBanner.hidden = true;
    wishPopover.hidden = true;
    sky.setWishes([]);
    renderStarHotspots();
    renderWishHotspots();
    renderProgressTrack();
    updateHudState();
    showToast("Journey reset to the beginning");
  });

  studioResetConfigBtn.addEventListener("click", function () {
    try {
      window.localStorage.removeItem(CONFIG_STORAGE_KEY);
    } catch (err) {
      // Ignore
    }
    config = deepClone(BASE_CONFIG);
    renderTextFromConfig();
    renderStudioBody();
    showToast("Restored default config");
  });

  studioDownloadBtn.addEventListener("click", function () {
    var fileBody =
      "/**\n" +
      " * THE STAR MAP OF US — PERSONALIZED CONFIG\n" +
      " * Replace your config.js file with this downloaded version.\n" +
      " */\n\n" +
      "window.STAR_MAP_CONFIG = " +
      JSON.stringify(config, null, 2) +
      ";\n";

    var blob = new Blob([fileBody], { type: "application/javascript;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "config.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Downloaded updated config.js");
  });

  // Boot Sequence
  window.StarAudio.setMuted(Boolean(progress.muted));
  sky.setWishes(progress.wishes);
  renderTextFromConfig();

  if (window.location.search.indexOf("edit=1") !== -1) {
    toggleStudio(true);
  }
})();
