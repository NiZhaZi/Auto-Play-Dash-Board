(function (global) {
  'use strict';

  const DEG = Math.PI / 180;
  const START_ANGLE = 135 * DEG;
  const SWEEP_ANGLE = 270 * DEG;
  const CX = 512;
  const CY = 512;

  function clamp(v, lo, hi) {
    v = Number(v);
    if (!Number.isFinite(v)) return lo;
    return Math.max(lo, Math.min(hi, v));
  }


  function normalizeHexColor(value, fallback) {
    const fb = fallback || '#00a88f';
    let s = String(value || '').trim();
    if (/^#[0-9a-f]{3}$/i.test(s)) {
      s = '#' + s.slice(1).split('').map(c => c + c).join('');
    }
    return /^#[0-9a-f]{6}$/i.test(s) ? s.toLowerCase() : fb.toLowerCase();
  }

  function hexToRgb(value, fallback) {
    const hex = normalizeHexColor(value, fallback || '#00a88f');
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16)
    };
  }

  function rgba(value, alpha, fallback) {
    const c = hexToRgb(value, fallback || '#00a88f');
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${clamp(alpha, 0, 1)})`;
  }

  function mixHex(a, b, t) {
    const ca = hexToRgb(a, '#00a88f');
    const cb = hexToRgb(b, '#ffffff');
    t = clamp(t, 0, 1);
    const r = Math.round(ca.r + (cb.r - ca.r) * t);
    const g = Math.round(ca.g + (cb.g - ca.g) * t);
    const bl = Math.round(ca.b + (cb.b - ca.b) * t);
    return '#' + [r, g, bl].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function angleFor(value, maxValue) {
    const ratio = clamp(value / Math.max(maxValue, 1), 0, 1);
    return START_ANGLE + SWEEP_ANGLE * ratio;
  }

  function polar(radius, angle) {
    return {
      x: CX + Math.cos(angle) * radius,
      y: CY + Math.sin(angle) * radius
    };
  }

  function line(ctx, r1, r2, angle, width, color) {
    const p1 = polar(r1, angle);
    const p2 = polar(r2, angle);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.lineCap = 'butt';
    ctx.stroke();
  }

  function arc(ctx, radius, start, end, width, color, cap) {
    ctx.beginPath();
    ctx.arc(CX, CY, radius, start, end, false);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.lineCap = cap || 'butt';
    ctx.stroke();
  }

  function text(ctx, value, x, y, size, color, align, weight) {
    ctx.save();
    ctx.fillStyle = color || '#fff';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${weight || 500} ${size}px Kanit, Arial, sans-serif`;
    ctx.fillText(String(value), x, y);
    ctx.restore();
  }

  function clearAndBackground(ctx, themeColor) {
    const theme = normalizeHexColor(themeColor, '#00a88f');
    ctx.clearRect(0, 0, 1024, 1024);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1024, 1024);

    const glow = ctx.createRadialGradient(CX, CY, 185, CX, CY, 470);
    glow.addColorStop(0, '#020404');
    glow.addColorStop(0.58, rgba(theme, 0.08));
    glow.addColorStop(0.83, rgba(theme, 0.18));
    glow.addColorStop(1, rgba(theme, 0.045));
    ctx.beginPath();
    ctx.arc(CX, CY, 459, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Outer bezel.
    arc(ctx, 468, 0, Math.PI * 2, 12, '#0f171a');
    arc(ctx, 457, 0, Math.PI * 2, 2, '#778286');
    arc(ctx, 448, 0, Math.PI * 2, 5, '#050808');

    // Inner display well.
    const inner = ctx.createRadialGradient(CX, CY, 120, CX, CY, 310);
    inner.addColorStop(0, '#000000');
    inner.addColorStop(1, rgba(theme, 0.035));
    ctx.beginPath();
    ctx.arc(CX, CY, 286, 0, Math.PI * 2);
    ctx.fillStyle = inner;
    ctx.fill();
    arc(ctx, 290, 0, Math.PI * 2, 4, rgba(theme, 0.34));
    arc(ctx, 284, 0, Math.PI * 2, 2, theme);
  }



  function ringSector(ctx, innerRadius, outerRadius, start, end, fillStyle) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, outerRadius, start, end, false);
    ctx.arc(CX, CY, innerRadius, end, start, true);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.restore();
  }

  function drawSweepGlow(ctx, value, maxValue, opts) {
    value = clamp(value, 0, maxValue);
    if (value <= 0) return;
    const end = angleFor(value, maxValue);
    const innerRadius = opts.innerRadius || 336;
    const outerRadius = opts.outerRadius || 443;
    const segments = opts.segments || 60;
    const leadColor = opts.leadColor || { r: 255, g: 255, b: 255, a: 0.92 };
    const tailColor = opts.tailColor || { r: 170, g: 178, b: 182, a: 0.28 };
    const span = Math.max(end - START_ANGLE, 0);

    for (let i = 0; i < segments; i++) {
      const t0 = i / segments;
      const t1 = (i + 1) / segments;
      const a0 = START_ANGLE + span * t0;
      const a1 = START_ANGLE + span * t1;
      const mix = Math.pow(t1, 1.25);
      const r = Math.round(tailColor.r + (leadColor.r - tailColor.r) * mix);
      const g = Math.round(tailColor.g + (leadColor.g - tailColor.g) * mix);
      const b = Math.round(tailColor.b + (leadColor.b - tailColor.b) * mix);
      const alpha = tailColor.a + (leadColor.a - tailColor.a) * mix;
      ringSector(ctx, innerRadius, outerRadius, a0, a1, `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`);
    }

    // soft inner bloom
    const glowSpanStart = Math.max(START_ANGLE, end - 16 * DEG);
    const glow = ctx.createRadialGradient(CX, CY, innerRadius - 20, CX, CY, outerRadius + 8);
    glow.addColorStop(0, 'rgba(255,255,255,0.00)');
    glow.addColorStop(0.6, 'rgba(255,255,255,0.03)');
    glow.addColorStop(1, 'rgba(255,255,255,0.16)');
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, outerRadius + 2, glowSpanStart, end, false);
    ctx.arc(CX, CY, innerRadius - 8, end, glowSpanStart, true);
    ctx.closePath();
    ctx.fillStyle = glow;
    ctx.fill();
    ctx.restore();

    // bright leading edge accent
    arc(ctx, 438, Math.max(START_ANGLE, end - 1.9 * DEG), end + 0.2 * DEG, 10, '#f8ffff', 'round');
  }

  function drawScale(ctx, opts) {
    const maxValue = opts.maxValue;
    const minorStep = opts.minorStep;
    const majorStep = opts.majorStep;
    const midStep = opts.midStep || 0;
    const labelFormatter = opts.labelFormatter || (v => String(v));
    const tickColor = opts.tickColor || (() => '#e8eeee');
    const labelColor = opts.labelColor || (() => '#f5f7f7');
    const labelRadius = opts.labelRadius || 365;

    const count = Math.round(maxValue / minorStep);
    for (let i = 0; i <= count; i++) {
      const value = i * minorStep;
      const a = angleFor(value, maxValue);
      const major = Math.abs(value / majorStep - Math.round(value / majorStep)) < 1e-6;
      const mid = !major && midStep > 0 && Math.abs(value / midStep - Math.round(value / midStep)) < 1e-6;
      const r1 = major ? 407 : (mid ? 416 : 424);
      const width = major ? 8 : (mid ? 5 : 3);
      line(ctx, r1, 443, a, width, tickColor(value));

      if (major) {
        const p = polar(labelRadius, a);
        text(ctx, labelFormatter(value), p.x, p.y, opts.labelSize || 34, labelColor(value), 'center', 500);
      }
    }
  }

  function drawProgress(ctx, value, maxValue, opts) {
    opts = opts || {};
    const color = normalizeHexColor(opts.color, '#05d2b5');
    const end = angleFor(value, maxValue);
    arc(ctx, 309, START_ANGLE, START_ANGLE + SWEEP_ANGLE, 12, rgba(color, 0.34), 'round');
    if (value > 0) {
      arc(ctx, 309, START_ANGLE, end, 13, color, 'round');
    }
  }

  function drawLowerBezelAccent(ctx) {
    // Small bright lower bezel accent inspired by the reference cluster.
    arc(ctx, 452, 48 * DEG, 132 * DEG, 7, '#eef2f2', 'round');
  }

  function drawFuelIcon(ctx, x, y) {
    ctx.save();
    ctx.strokeStyle = '#edf3f2';
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeRect(x - 23, y - 29, 31, 45);
    ctx.beginPath();
    ctx.moveTo(x + 8, y - 19);
    ctx.lineTo(x + 23, y - 8);
    ctx.lineTo(x + 23, y + 13);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 29, y + 20);
    ctx.lineTo(x + 16, y + 20);
    ctx.stroke();
    ctx.restore();
  }

  function drawTempIcon(ctx, x, y) {
    ctx.save();
    ctx.strokeStyle = '#edf3f2';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y - 28);
    ctx.lineTo(x, y + 8);
    ctx.arc(x, y + 15, 9, -Math.PI / 2, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const yy = y + 30 + i * 10;
      ctx.moveTo(x - 26, yy);
      ctx.quadraticCurveTo(x - 17, yy - 7, x - 8, yy);
      ctx.quadraticCurveTo(x + 1, yy + 7, x + 10, yy);
      ctx.quadraticCurveTo(x + 19, yy - 7, x + 28, yy);
    }
    ctx.stroke();
    ctx.restore();
  }

  function resolveUnitSystem(runtimeValue, setupData) {
    const raw = String(runtimeValue || 'auto').toLowerCase();
    if (raw === 'metric' || raw === 'imperial') return raw;
    const gameUnit = String((setupData && setupData.uiUnitLength) || 'metric').toLowerCase();
    return gameUnit === 'imperial' ? 'imperial' : 'metric';
  }

  function resolveTemperatureSystem(runtimeValue, setupData) {
    const raw = String(runtimeValue || 'auto').toLowerCase();
    if (raw === 'metric' || raw === 'imperial') return raw;
    const gameTemp = String((setupData && setupData.uiUnitTemperature) || 'c').toLowerCase();
    return (gameTemp === 'f' || gameTemp === 'fahrenheit') ? 'imperial' : 'metric';
  }

  function titleCase(s) {
    s = String(s || '').trim();
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  global.ModernCluster = {
    DEG,
    START_ANGLE,
    SWEEP_ANGLE,
    CX,
    CY,
    clamp,
    normalizeHexColor,
    hexToRgb,
    rgba,
    mixHex,
    angleFor,
    polar,
    line,
    arc,
    text,
    clearAndBackground,
    ringSector,
    drawSweepGlow,
    drawScale,
    drawProgress,
    drawLowerBezelAccent,
    drawFuelIcon,
    drawTempIcon,
    resolveUnitSystem,
    resolveTemperatureSystem,
    titleCase
  };
})(window);
