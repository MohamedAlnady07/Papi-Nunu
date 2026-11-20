/**
 * ============================================================================
 * THE STAR MAP OF US — INTERACTIVE CELESTIAL CANVAS ENGINE
 * ============================================================================
 * Renders the living nocturnal sky, twinkling multi-depth starfield,
 * aspect-locked heart constellation, animated light threads, particle bursts,
 * shooting stars, and persistent rose-gold wish stars.
 * ============================================================================
 */

(function () {
  var HEART_COORDS = [
    { id: 1, x: 0.0, y: 0.86 },  // Bottom Apex
    { id: 2, x: -0.84, y: 0.04 }, // Left Flank
    { id: 3, x: -0.5, y: -0.78 }, // Left Crown
    { id: 4, x: 0.0, y: -0.34 }, // Center Cleft
    { id: 5, x: 0.5, y: -0.78 }, // Right Crown
    { id: 6, x: 0.84, y: 0.04 }, // Right Flank
    { id: 7, x: 0.0, y: 0.2 }   // The Heart Core
  ];

  var PERIMETER_EDGES = [
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 1]
  ];

  var INNER_RAYS = [
    [7, 1],
    [7, 3],
    [7, 5]
  ];

  function easeOutCubic(t) {
    var inv = 1 - Math.max(0, Math.min(1, t));
    return 1 - inv * inv * inv;
  }

  function hexToRgba(color, alpha) {
    if (!color) return "rgba(233, 196, 118, " + alpha + ")";
    var trimmed = color.trim();
    if (trimmed.indexOf("#") === 0) {
      var hex = trimmed.slice(1);
      if (hex.length === 3) {
        hex =
          hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      var num = parseInt(hex, 16);
      if (!isNaN(num)) {
        var r = (num >> 16) & 255;
        var g = (num >> 8) & 255;
        var b = num & 255;
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
      }
    }
    if (trimmed.indexOf("rgb") === 0) {
      var nums = trimmed.match(/[\d.]+/g);
      if (nums && nums.length >= 3) {
        return (
          "rgba(" + nums[0] + ", " + nums[1] + ", " + nums[2] + ", " + alpha + ")"
        );
      }
    }
    return "rgba(233, 196, 118, " + alpha + ")";
  }

  function StarSky(canvas, options) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.opts = options || {};

    this.width = window.innerWidth || 1024;
    this.height = window.innerHeight || 768;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.discovered = new Set();
    this.activeStarId = null;
    this.hoveredStarId = null;
    this.completed = false;
    this.reducedMotion = false;
    this.act = "curtain"; // "curtain" | "sky" | "finale"

    this.pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.edgeProgress = {};
    this.innerRayProgress = 0;

    this.ambientStars = [];
    this.particles = [];
    this.ripples = [];
    this.shootingStars = [];
    this.wishes = [];
    this.starPositions = {};

    this.nextShootingAt = performance.now() + 5500;
    this.lastTime = performance.now();
    this.rafId = null;

    this.colors = {
      skyDeep: "#060914",
      skyMid: "#0C1226",
      inkPrimary: "#F6F1E7",
      inkMuted: "#B6B2C3",
      accentGold: "#E9C476",
      accentWarm: "#F6E2B3",
      accentHeart: "#D98C8C"
    };

    this._initAmbientStars();
    this.setThemeColors();
    this.resize();
    this._bindEvents();
    this._startLoop();
  }

  StarSky.prototype._initAmbientStars = function () {
    this.ambientStars = [];
    var count = 215;
    for (var i = 0; i < count; i += 1) {
      var depth = i < 120 ? 0.35 : i < 185 ? 0.65 : 1.0;
      this.ambientStars.push({
        nx: Math.random(),
        ny: Math.random(),
        radius: depth === 0.35 ? 0.55 + Math.random() * 0.55 : depth === 0.65 ? 0.8 + Math.random() * 0.7 : 1.1 + Math.random() * 1.05,
        depth: depth,
        baseAlpha: 0.16 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
        speed: 0.45 + Math.random() * 1.35,
        warmth: Math.random() > 0.78
      });
    }
  };

  StarSky.prototype._bindEvents = function () {
    var self = this;

    this._onResize = function () {
      self.resize();
    };

    this._onPointerMove = function (e) {
      if (self.reducedMotion || self.width < 768) return;
      var nx = (e.clientX / Math.max(1, self.width)) * 2 - 1;
      var ny = (e.clientY / Math.max(1, self.height)) * 2 - 1;
      self.pointer.targetX = nx * 12;
      self.pointer.targetY = ny * 10;
    };

    window.addEventListener("resize", this._onResize);
    window.addEventListener("orientationchange", this._onResize);
    window.addEventListener("pointermove", this._onPointerMove, { passive: true });
  };

  StarSky.prototype.setThemeColors = function () {
    try {
      var styles = window.getComputedStyle(document.documentElement);
      var read = function (name, fallback) {
        var val = styles.getPropertyValue(name);
        return val && val.trim() ? val.trim() : fallback;
      };
      this.colors = {
        skyDeep: read("--sky-deep", "#060914"),
        skyMid: read("--sky-mid", "#0C1226"),
        inkPrimary: read("--ink-primary", "#F6F1E7"),
        inkMuted: read("--ink-muted", "#B6B2C3"),
        accentGold: read("--accent-gold", "#E9C476"),
        accentWarm: read("--accent-warm", "#F6E2B3"),
        accentHeart: read("--accent-heart", "#D98C8C")
      };
    } catch (err) {
      // Keep fallback palette
    }
  };

  StarSky.prototype.resize = function () {
    this.width = window.innerWidth || document.documentElement.clientWidth || 1024;
    this.height = window.innerHeight || document.documentElement.clientHeight || 768;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = this.width + "px";
    this.canvas.style.height = this.height + "px";

    this._computeConstellationPositions();
    if (typeof this.opts.onLayout === "function") {
      this.opts.onLayout(this.getStarScreenPositions(), this.getWishScreenPositions());
    }
  };

  StarSky.prototype._computeConstellationPositions = function () {
    var w = this.width;
    var h = this.height;
    var safeWidth = w < 640 ? w * 0.84 : w * 0.72;
    var safeHeight = h < 640 ? h * 0.56 : h * 0.6;
    var scale = Math.min(safeWidth, safeHeight) / 1.74;
    var cx = w * 0.5;
    var cy = h < 640 ? h * 0.47 : h * 0.49;

    this.starPositions = {};
    for (var i = 0; i < HEART_COORDS.length; i += 1) {
      var pt = HEART_COORDS[i];
      this.starPositions[pt.id] = {
        id: pt.id,
        x: cx + pt.x * scale,
        y: cy + pt.y * scale
      };
    }
  };

  StarSky.prototype.getStarScreenPositions = function () {
    return this.starPositions;
  };

  StarSky.prototype.getWishScreenPositions = function () {
    var out = [];
    for (var i = 0; i < this.wishes.length; i += 1) {
      var w = this.wishes[i];
      out.push({
        id: w.id,
        text: w.text,
        x: w.xNorm * this.width,
        y: w.yNorm * this.height
      });
    }
    return out;
  };

  StarSky.prototype.setDiscovered = function (discoveredSet) {
    this.discovered = new Set(discoveredSet);
  };

  StarSky.prototype.setActiveStar = function (starId) {
    this.activeStarId = starId;
  };

  StarSky.prototype.setHoveredStar = function (starId) {
    this.hoveredStarId = starId;
  };

  StarSky.prototype.setAct = function (act) {
    this.act = act;
  };

  StarSky.prototype.setCompleted = function (isCompleted) {
    this.completed = Boolean(isCompleted);
    if (!this.completed) {
      this.innerRayProgress = 0;
      this.edgeProgress = {};
    }
  };

  StarSky.prototype.setReducedMotion = function (reduced) {
    this.reducedMotion = Boolean(reduced);
    if (this.reducedMotion) {
      this.pointer.x = 0;
      this.pointer.y = 0;
      this.pointer.targetX = 0;
      this.pointer.targetY = 0;
    }
  };

  StarSky.prototype.setWishes = function (wishesArray) {
    this.wishes = Array.isArray(wishesArray) ? wishesArray.slice() : [];
    if (typeof this.opts.onLayout === "function") {
      this.opts.onLayout(this.getStarScreenPositions(), this.getWishScreenPositions());
    }
  };

  StarSky.prototype.burstAtStar = function (starId, isCelebration) {
    var pos = this.starPositions[starId];
    if (!pos) return;
    var count = isCelebration ? 34 : 20;
    for (var i = 0; i < count; i += 1) {
      var angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
      var speed = (isCelebration ? 32 : 22) + Math.random() * (isCelebration ? 86 : 58);
      this.particles.push({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.1 + Math.random() * 1.9,
        life: 0,
        maxLife: 0.75 + Math.random() * 0.65,
        heart: isCelebration && Math.random() > 0.45
      });
    }
    this.ripples.push({
      x: pos.x,
      y: pos.y,
      radius: 4,
      maxRadius: isCelebration ? 76 : 48,
      life: 0,
      maxLife: 0.85,
      heart: Boolean(isCelebration)
    });
  };

  StarSky.prototype.burstCompletion = function () {
    for (var i = 1; i <= 7; i += 1) {
      this.burstAtStar(i, true);
    }
  };

  StarSky.prototype.spawnEmptyTap = function (clientX, clientY) {
    this.ripples.push({
      x: clientX,
      y: clientY,
      radius: 2,
      maxRadius: 34,
      life: 0,
      maxLife: 0.72,
      heart: false
    });

    if (!this.reducedMotion) {
      for (var i = 0; i < 8; i += 1) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 14 + Math.random() * 34;
        this.particles.push({
          x: clientX,
          y: clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 0.9 + Math.random() * 1.2,
          life: 0,
          maxLife: 0.65 + Math.random() * 0.45,
          heart: false
        });
      }
    }
  };

  StarSky.prototype.launchWishStar = function (wishObj) {
    if (!wishObj) return;
    this.wishes.push(wishObj);
    var targetX = wishObj.xNorm * this.width;
    var targetY = wishObj.yNorm * this.height;

    this.ripples.push({
      x: targetX,
      y: targetY,
      radius: 4,
      maxRadius: 68,
      life: 0,
      maxLife: 1.05,
      heart: true
    });

    if (!this.reducedMotion) {
      this.shootingStars.push({
        x: this.width * 0.5,
        y: this.height * 0.85,
        vx: (targetX - this.width * 0.5) * 1.35,
        vy: (targetY - this.height * 0.85) * 1.35,
        life: 0,
        maxLife: 0.65,
        heart: true
      });
      for (var i = 0; i < 24; i += 1) {
        var a = Math.random() * Math.PI * 2;
        var s = 18 + Math.random() * 64;
        this.particles.push({
          x: targetX,
          y: targetY,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          size: 1.2 + Math.random() * 1.8,
          life: 0,
          maxLife: 0.85 + Math.random() * 0.6,
          heart: true
        });
      }
    }

    if (typeof this.opts.onLayout === "function") {
      this.opts.onLayout(this.getStarScreenPositions(), this.getWishScreenPositions());
    }
  };

  StarSky.prototype._getNextSuggestedStarId = function () {
    for (var id = 1; id <= 7; id += 1) {
      if (!this.discovered.has(id)) return id;
    }
    return null;
  };

  StarSky.prototype._startLoop = function () {
    var self = this;
    function frame(now) {
      var dt = Math.min(0.05, Math.max(0.001, (now - self.lastTime) / 1000));
      self.lastTime = now;
      self._update(dt, now);
      self._draw(now);
      self.rafId = window.requestAnimationFrame(frame);
    }
    this.rafId = window.requestAnimationFrame(frame);
  };

  StarSky.prototype._update = function (dt, now) {
    // Smooth pointer parallax
    if (!this.reducedMotion) {
      this.pointer.x += (this.pointer.targetX - this.pointer.x) * Math.min(1, dt * 4);
      this.pointer.y += (this.pointer.targetY - this.pointer.y) * Math.min(1, dt * 4);
    }

    // Animate edge drawing when both endpoints are discovered
    var edgeSpeed = this.reducedMotion ? 20 : 1.55;
    for (var i = 0; i < PERIMETER_EDGES.length; i += 1) {
      var a = PERIMETER_EDGES[i][0];
      var b = PERIMETER_EDGES[i][1];
      var key = a + "-" + b;
      var activeEdge = this.discovered.has(a) && this.discovered.has(b);
      if (activeEdge) {
        var cur = this.edgeProgress[key] || 0;
        this.edgeProgress[key] = Math.min(1, cur + dt * edgeSpeed);
      } else {
        this.edgeProgress[key] = 0;
      }
    }

    if (this.completed) {
      this.innerRayProgress = Math.min(1, this.innerRayProgress + dt * (this.reducedMotion ? 20 : 0.9));
    }

    // Occasional distant shooting star
    if (!this.reducedMotion && now >= this.nextShootingAt) {
      this.nextShootingAt = now + 10000 + Math.random() * 6000;
      var fromLeft = Math.random() > 0.35;
      this.shootingStars.push({
        x: fromLeft ? this.width * (0.1 + Math.random() * 0.4) : this.width * (0.55 + Math.random() * 0.35),
        y: this.height * (0.06 + Math.random() * 0.25),
        vx: (fromLeft ? 1 : -1) * (280 + Math.random() * 190),
        vy: 95 + Math.random() * 90,
        life: 0,
        maxLife: 0.7 + Math.random() * 0.35,
        heart: false
      });
    }

    // Update particles
    for (var p = this.particles.length - 1; p >= 0; p -= 1) {
      var pt = this.particles[p];
      pt.life += dt;
      if (pt.life >= pt.maxLife) {
        this.particles.splice(p, 1);
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.96;
      pt.vy *= 0.96;
    }

    // Update ripples
    for (var r = this.ripples.length - 1; r >= 0; r -= 1) {
      var rp = this.ripples[r];
      rp.life += dt;
      if (rp.life >= rp.maxLife) {
        this.ripples.splice(r, 1);
      }
    }

    // Update shooting stars
    for (var s = this.shootingStars.length - 1; s >= 0; s -= 1) {
      var st = this.shootingStars[s];
      st.life += dt;
      if (st.life >= st.maxLife) {
        this.shootingStars.splice(s, 1);
        continue;
      }
      st.x += st.vx * dt;
      st.y += st.vy * dt;
    }
  };

  StarSky.prototype._draw = function (now) {
    var ctx = this.ctx;
    var w = this.width;
    var h = this.height;
    var timeSec = now * 0.001;

    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // 1. Deep nocturnal background gradient
    var bgGrad = ctx.createRadialGradient(
      w * 0.5,
      h * 0.44,
      Math.min(w, h) * 0.04,
      w * 0.5,
      h * 0.5,
      Math.max(w, h) * 0.85
    );
    bgGrad.addColorStop(0, this.colors.skyMid);
    bgGrad.addColorStop(1, this.colors.skyDeep);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle soft nebula halo behind the constellation center
    var nebulaRadius = Math.min(w, h) * (this.completed ? 0.44 : 0.34);
    var nebGrad = ctx.createRadialGradient(
      w * 0.5,
      h * 0.48,
      0,
      w * 0.5,
      h * 0.48,
      nebulaRadius
    );
    var nebulaColor = this.completed ? this.colors.accentHeart : this.colors.accentGold;
    nebGrad.addColorStop(0, hexToRgba(nebulaColor, this.completed ? 0.1 : 0.045));
    nebGrad.addColorStop(0.55, hexToRgba(this.colors.accentGold, 0.02));
    nebGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = nebGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Ambient multi-depth twinkling stars
    for (var i = 0; i < this.ambientStars.length; i += 1) {
      var st = this.ambientStars[i];
      var sx = st.nx * w - this.pointer.x * st.depth;
      var sy = st.ny * h - this.pointer.y * st.depth;
      var twinkle = this.reducedMotion
        ? 0.82
        : 0.55 + 0.45 * Math.sin(timeSec * st.speed + st.phase);
      var alpha = st.baseAlpha * twinkle;

      ctx.beginPath();
      ctx.arc(sx, sy, st.radius, 0, Math.PI * 2);
      ctx.fillStyle = st.warmth
        ? hexToRgba(this.colors.accentWarm, alpha)
        : hexToRgba(this.colors.inkPrimary, alpha);
      ctx.fill();
    }

    // 3. Distant shooting stars
    for (var sh = 0; sh < this.shootingStars.length; sh += 1) {
      var shoot = this.shootingStars[sh];
      var prog = shoot.life / shoot.maxLife;
      var fade = Math.sin(prog * Math.PI);
      var tailLen = shoot.heart ? 58 : 84;
      var mag = Math.hypot(shoot.vx, shoot.vy) || 1;
      var tx = shoot.x - (shoot.vx / mag) * tailLen;
      var ty = shoot.y - (shoot.vy / mag) * tailLen;

      var sGrad = ctx.createLinearGradient(tx, ty, shoot.x, shoot.y);
      sGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
      sGrad.addColorStop(
        1,
        hexToRgba(shoot.heart ? this.colors.accentHeart : this.colors.accentWarm, 0.72 * fade)
      );

      ctx.strokeStyle = sGrad;
      ctx.lineWidth = shoot.heart ? 1.8 : 1.25;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(shoot.x, shoot.y);
      ctx.stroke();
    }

    // 4. Inner completion gemstone rays (when all 7 discovered)
    if (this.completed && this.innerRayProgress > 0) {
      var rayEase = easeOutCubic(this.innerRayProgress);
      for (var r = 0; r < INNER_RAYS.length; r += 1) {
        var pA = this.starPositions[INNER_RAYS[r][0]];
        var pB = this.starPositions[INNER_RAYS[r][1]];
        if (!pA || !pB) continue;
        var ex = pA.x + (pB.x - pA.x) * rayEase;
        var ey = pA.y + (pB.y - pA.y) * rayEase;

        ctx.save();
        ctx.strokeStyle = hexToRgba(this.colors.accentHeart, 0.22 * rayEase);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 5. Constellation perimeter threads
    for (var e = 0; e < PERIMETER_EDGES.length; e += 1) {
      var idA = PERIMETER_EDGES[e][0];
      var idB = PERIMETER_EDGES[e][1];
      var posA = this.starPositions[idA];
      var posB = this.starPositions[idB];
      if (!posA || !posB) continue;

      var key = idA + "-" + idB;
      var rawProg = this.edgeProgress[key] || 0;

      if (rawProg > 0) {
        var edgeT = easeOutCubic(rawProg);
        var curX = posA.x + (posB.x - posA.x) * edgeT;
        var curY = posA.y + (posB.y - posA.y) * edgeT;

        // Soft outer luminous halo line
        ctx.strokeStyle = hexToRgba(
          this.completed ? this.colors.accentHeart : this.colors.accentGold,
          this.completed ? 0.2 : 0.16
        );
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(posA.x, posA.y);
        ctx.lineTo(curX, curY);
        ctx.stroke();

        // Crisp hairline thread
        ctx.strokeStyle = hexToRgba(
          this.completed ? this.colors.accentWarm : this.colors.accentGold,
          0.74
        );
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(posA.x, posA.y);
        ctx.lineTo(curX, curY);
        ctx.stroke();
      } else {
        // Subtle dashed guide hint for undiscovered edges once inside the sky
        if (this.act !== "curtain") {
          ctx.save();
          ctx.setLineDash([2, 6]);
          ctx.strokeStyle = hexToRgba(this.colors.inkMuted, 0.14);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(posA.x, posA.y);
          ctx.lineTo(posB.x, posB.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // 6. The 7 Constellation Stars
    var nextId = this._getNextSuggestedStarId();
    for (var sIdx = 0; sIdx < HEART_COORDS.length; sIdx += 1) {
      var sid = HEART_COORDS[sIdx].id;
      var sPos = this.starPositions[sid];
      if (!sPos) continue;

      var isDiscovered = this.discovered.has(sid);
      var isActive = this.activeStarId === sid;
      var isHovered = this.hoveredStarId === sid;
      var isSuggested = sid === nextId && this.act !== "curtain";

      // Breathing guide ring on next suggested star
      if (isSuggested) {
        var pulse = this.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(timeSec * 2.4);
        var ringRadius = 15 + pulse * 6;
        ctx.beginPath();
        ctx.arc(sPos.x, sPos.y, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(this.colors.accentGold, 0.25 + pulse * 0.35);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Soft star halo
      var haloRadius = isDiscovered ? (isActive || isHovered ? 32 : 24) : isHovered ? 20 : 14;
      var haloColor =
        this.completed && sid === 7
          ? this.colors.accentHeart
          : isDiscovered
          ? this.colors.accentGold
          : this.colors.inkPrimary;
      var haloAlpha = isDiscovered ? (isActive ? 0.42 : 0.26) : isHovered ? 0.2 : 0.1;

      var sHalo = ctx.createRadialGradient(sPos.x, sPos.y, 0, sPos.x, sPos.y, haloRadius);
      sHalo.addColorStop(0, hexToRgba(haloColor, haloAlpha));
      sHalo.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = sHalo;
      ctx.beginPath();
      ctx.arc(sPos.x, sPos.y, haloRadius, 0, Math.PI * 2);
      ctx.fill();

      // 4-point celestial flare for discovered or active stars
      if (isDiscovered || isHovered) {
        var flareSize = isActive ? 14 : isDiscovered ? 11 : 8;
        ctx.strokeStyle = hexToRgba(
          this.completed && sid === 7 ? this.colors.accentHeart : this.colors.accentWarm,
          isDiscovered ? 0.85 : 0.45
        );
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sPos.x - flareSize, sPos.y);
        ctx.lineTo(sPos.x + flareSize, sPos.y);
        ctx.moveTo(sPos.x, sPos.y - flareSize);
        ctx.lineTo(sPos.x, sPos.y + flareSize);
        ctx.stroke();
      }

      // Crisp star core
      var coreR = isDiscovered ? (isActive ? 4.4 : 3.6) : isHovered ? 3.2 : 2.3;
      ctx.beginPath();
      ctx.arc(sPos.x, sPos.y, coreR, 0, Math.PI * 2);
      ctx.fillStyle = isDiscovered
        ? this.completed && sid === 7
          ? this.colors.accentHeart
          : this.colors.accentWarm
        : hexToRgba(this.colors.inkPrimary, 0.72);
      ctx.fill();
    }

    // 7. Permanent Rose-Gold Wish Stars
    for (var wi = 0; wi < this.wishes.length; wi += 1) {
      var wish = this.wishes[wi];
      var wx = wish.xNorm * w;
      var wy = wish.yNorm * h;
      var wPulse = this.reducedMotion ? 0.7 : 0.65 + 0.35 * Math.sin(timeSec * 1.9 + wi * 1.3);

      var wGlow = ctx.createRadialGradient(wx, wy, 0, wx, wy, 20);
      wGlow.addColorStop(0, hexToRgba(this.colors.accentHeart, 0.38 * wPulse));
      wGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = wGlow;
      ctx.beginPath();
      ctx.arc(wx, wy, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = hexToRgba(this.colors.accentHeart, 0.8 * wPulse);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(wx - 7, wy);
      ctx.lineTo(wx + 7, wy);
      ctx.moveTo(wx, wy - 7);
      ctx.lineTo(wx, wy + 7);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(wx, wy, 2.8, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.accentWarm;
      ctx.fill();
    }

    // 8. Ripples & Stardust Particles
    for (var rpIdx = 0; rpIdx < this.ripples.length; rpIdx += 1) {
      var rp = this.ripples[rpIdx];
      var rt = rp.life / rp.maxLife;
      var rEase = easeOutCubic(rt);
      var rad = rp.radius + (rp.maxRadius - rp.radius) * rEase;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rad, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(
        rp.heart ? this.colors.accentHeart : this.colors.accentGold,
        (1 - rt) * 0.48
      );
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (var ptIdx = 0; ptIdx < this.particles.length; ptIdx += 1) {
      var pItem = this.particles[ptIdx];
      var pAlpha = 1 - pItem.life / pItem.maxLife;
      ctx.beginPath();
      ctx.arc(pItem.x, pItem.y, pItem.size, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(
        pItem.heart ? this.colors.accentHeart : this.colors.accentWarm,
        pAlpha * 0.85
      );
      ctx.fill();
    }

    ctx.restore();
  };

  StarSky.prototype.destroy = function () {
    if (this.rafId) {
      window.cancelAnimationFrame(this.rafId);
    }
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("orientationchange", this._onResize);
    window.removeEventListener("pointermove", this._onPointerMove);
  };

  window.StarSky = StarSky;
})();
