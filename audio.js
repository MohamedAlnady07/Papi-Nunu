/**
 * ============================================================================
 * THE STAR MAP OF US — CELESTIAL WEB AUDIO ENGINE
 * ============================================================================
 * Generates warm, zero-dependency pentatonic harp/celesta chimes via Web Audio API.
 * Works offline and degrades silently if audio is blocked or muted.
 * ============================================================================
 */

(function () {
  var STAR_NOTES_HZ = [
    293.66, // D4  - Star I
    369.99, // F#4 - Star II
    440.00, // A4  - Star III
    493.88, // B4  - Star IV
    587.33, // D5  - Star V
    659.25, // E5  - Star VI
    739.99  // F#5 - Star VII
  ];

  var WHISPER_NOTES_HZ = [880.0, 987.77, 1174.66, 1318.51];

  var ctx = null;
  var masterGain = null;
  var muted = false;
  var whisperCounter = 0;

  function ensureContext() {
    if (muted) return null;
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!ctx) {
        ctx = new AudioCtx();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.55;
        masterGain.connect(ctx.destination);
      }
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      return ctx;
    } catch (err) {
      return null;
    }
  }

  function playTone(freq, options) {
    var audio = ensureContext();
    if (!audio || !masterGain) return;

    var opts = options || {};
    var delay = opts.delay || 0;
    var duration = opts.duration || 2.1;
    var volume = opts.volume || 0.16;
    var cutoff = opts.cutoff || 1900;
    var harmonicMix = opts.harmonicMix !== undefined ? opts.harmonicMix : 0.25;

    try {
      var start = audio.currentTime + delay;

      var filter = audio.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(cutoff, start);
      filter.Q.value = 0.8;

      var env = audio.createGain();
      env.gain.setValueAtTime(0.0001, start);
      env.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), start + 0.025);
      env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      var oscFund = audio.createOscillator();
      oscFund.type = "sine";
      oscFund.frequency.setValueAtTime(freq, start);

      var oscOvertone = audio.createOscillator();
      oscOvertone.type = "triangle";
      oscOvertone.frequency.setValueAtTime(freq * 2, start);

      var overtoneGain = audio.createGain();
      overtoneGain.gain.setValueAtTime(harmonicMix, start);
      overtoneGain.gain.exponentialRampToValueAtTime(0.01, start + duration * 0.45);

      oscFund.connect(filter);
      oscOvertone.connect(overtoneGain);
      overtoneGain.connect(filter);
      filter.connect(env);
      env.connect(masterGain);

      oscFund.start(start);
      oscOvertone.start(start);
      oscFund.stop(start + duration + 0.05);
      oscOvertone.stop(start + duration + 0.05);
    } catch (err) {
      // Ignore Web Audio scheduling errors gracefully
    }
  }

  window.StarAudio = {
    unlock: function () {
      return Boolean(ensureContext());
    },

    setMuted: function (isMuted) {
      muted = Boolean(isMuted);
      try {
        if (ctx && masterGain) {
          var now = ctx.currentTime;
          masterGain.gain.cancelScheduledValues(now);
          masterGain.gain.setTargetAtTime(muted ? 0.0001 : 0.55, now, 0.04);
        }
      } catch (err) {
        // Ignore
      }
    },

    isMuted: function () {
      return muted;
    },

    playStar: function (starIndex) {
      var idx = Math.max(0, Math.min(STAR_NOTES_HZ.length - 1, starIndex | 0));
      var freq = STAR_NOTES_HZ[idx];
      playTone(freq, {
        duration: 2.35,
        volume: 0.17,
        cutoff: 2000,
        harmonicMix: 0.24
      });
      // Soft fifth shimmer an octave softer
      playTone(freq * 1.5, {
        delay: 0.055,
        duration: 1.65,
        volume: 0.045,
        cutoff: 1700,
        harmonicMix: 0.08
      });
    },

    playWhisper: function () {
      var freq = WHISPER_NOTES_HZ[whisperCounter % WHISPER_NOTES_HZ.length];
      whisperCounter += 1;
      playTone(freq, {
        duration: 0.95,
        volume: 0.075,
        cutoff: 2400,
        harmonicMix: 0.12
      });
    },

    playConstellationComplete: function () {
      // Warm Dmaj9 celestial arpeggio
      var chord = [293.66, 369.99, 440.0, 554.37, 659.25, 739.99, 880.0];
      for (var i = 0; i < chord.length; i += 1) {
        playTone(chord[i], {
          delay: i * 0.125,
          duration: 3.1 - i * 0.14,
          volume: 0.12,
          cutoff: 2200,
          harmonicMix: 0.18
        });
      }
    },

    playWish: function () {
      var shimmer = [440.0, 554.37, 659.25, 739.99, 880.0];
      for (var i = 0; i < shimmer.length; i += 1) {
        playTone(shimmer[i], {
          delay: i * 0.095,
          duration: 2.2,
          volume: 0.1,
          cutoff: 2500,
          harmonicMix: 0.16
        });
      }
    }
  };
})();
