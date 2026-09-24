(function () {
  'use strict';

  let ctx;
  let setupData = {};
  let latestData = { electrics: {}, engineInfo: {} };

  function cleanGear(value) {
    if (value === undefined || value === null) return '-';
    const s = String(value).trim();
    if (!s) return '-';
    const m = s.match(/^[SM](-?\d+)$/i);
    if (m) return m[1];
    if (s === '-1') return 'R';
    if (s === '0') return 'N';
    return s.length > 3 ? s.slice(-2) : s;
  }

  function draw() {
    if (!ctx || !window.ModernCluster) return;
    const M = window.ModernCluster;
    const e = latestData.electrics || {};
    const engineInfo = latestData.engineInfo || {};
    const unitSystem = M.resolveUnitSystem(e.autoPlayUnitSystem, setupData);
    const tempSystem = M.resolveTemperatureSystem(e.autoPlayUnitSystem, setupData);
    const isImperial = unitSystem === 'imperial';
    const isTempImperial = tempSystem === 'imperial';

    const rpm = Math.max(0, Number(e.rpmTacho) || 0);
    const redline = Math.max(1000, Number(engineInfo.redlineRPM) || Number(e.maxrpm) || 7000);
    const engineMax = Math.max(redline, Number(engineInfo.maxRPM) || redline);
    // Keep every printed RPM label an integer. Leave about 500 RPM of headroom,
    // then round the dial ceiling up to the next whole x1000 RPM value.
    const scaleMax = Math.max(6000, Math.ceil((Math.max(redline, engineMax) + 500) / 1000) * 1000);

    const waterC = Number(e.watertemp);
    const waterTemp = Number.isFinite(waterC) ? (isTempImperial ? waterC * 9 / 5 + 32 : waterC) : 0;
    const tempUnit = isTempImperial ? '°F' : '°C';
    const mode = M.titleCase(e.modeName || ((String(e.gear || '')[0] || '').toUpperCase() === 'S' ? 'sport' : '')) || 'Drive';
    const sweptMarkColor = '#0d1011';
    const themeColor = M.normalizeHexColor(setupData.themeColor, '#00d7c0');
    const themeHighlight = M.mixHex(themeColor, '#ffffff', 0.32);

    M.clearAndBackground(ctx, themeColor);
    M.drawSweepGlow(ctx, Math.min(rpm, scaleMax), scaleMax, {
      innerRadius: 332,
      outerRadius: 444,
      segments: 72,
      tailColor: { r: 186, g: 192, b: 195, a: 0.22 },
      leadColor: { r: 250, g: 253, b: 253, a: 0.94 }
    });

    // Redline background sector.
    const redStart = M.angleFor(redline, scaleMax);
    M.arc(ctx, 424, redStart, M.START_ANGLE + M.SWEEP_ANGLE, 39, 'rgba(129, 0, 0, 0.20)', 'butt');

    M.drawScale(ctx, {
      maxValue: scaleMax,
      minorStep: 100,
      midStep: 500,
      majorStep: 1000,
      labelRadius: 365,
      labelSize: 42,
      labelFormatter: v => String(Math.round(v / 1000)),
      tickColor: v => v <= rpm ? sweptMarkColor : (v >= redline ? '#ff3434' : '#edf2f2'),
      labelColor: v => v <= rpm ? sweptMarkColor : (v >= redline ? '#ff3434' : '#f5f7f7')
    });

    // Tachometer progress, including red over-rev portion.
    M.arc(ctx, 309, M.START_ANGLE, M.START_ANGLE + M.SWEEP_ANGLE, 12, M.rgba(themeColor, 0.34), 'round');
    if (rpm > 0) {
      const normalRPM = Math.min(rpm, redline);
      M.arc(ctx, 309, M.START_ANGLE, M.angleFor(normalRPM, scaleMax), 13, themeColor, 'round');
      if (rpm > redline) {
        M.arc(ctx, 309, redStart, M.angleFor(Math.min(rpm, scaleMax), scaleMax), 13, '#ff3434', 'round');
      }
    }
    M.drawLowerBezelAccent(ctx);

    // Current-RPM marker.
    const a = M.angleFor(rpm, scaleMax);
    M.line(ctx, 397, 447, a, 9, rpm >= redline ? '#ff3434' : themeHighlight);

    M.text(ctx, 'RPM ×1000', 512, 335, 31, '#9ca5a5', 'center', 400);
    M.text(ctx, cleanGear(e.gear), 512, 505, 172, '#ffffff', 'center', 600);
    M.text(ctx, mode, 512, 625, 46, '#e0e4e4', 'center', 400);

    // Water-temperature readout: place the icon+text in the bottom opening of the OUTER scale ring,
    // matching the original cluster instead of putting it inside the center display well.
    const tempText = `${Math.round(waterTemp)}${tempUnit}`;
    ctx.save();
    ctx.font = `400 36px Kanit, Arial, sans-serif`;
    const tempWidth = ctx.measureText(tempText).width;
    ctx.restore();
    const tempGroupStart = 512 - ((48 + 13 + tempWidth) / 2);
    ctx.save();
    ctx.translate(tempGroupStart + 24, 852);
    ctx.scale(0.80, 0.80);
    M.drawTempIcon(ctx, 0, 0);
    ctx.restore();
    M.text(ctx, tempText, tempGroupStart + 48 + 13, 858, 36, '#edf3f2', 'left', 400);
  }

  window.setup = function (data) {
    setupData = data || {};
    draw();
  };

  window.updateData = function (data) {
    latestData = data || { electrics: {}, engineInfo: {} };
    draw();
  };

  function init() {
    const canvas = document.getElementById('gauge');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    draw();

    // Browser-only preview data. BeamNG immediately replaces this through updateData().
    if (typeof beamng === 'undefined') {
      window.setup({ uiUnitLength: 'metric', themeColor: '#00d7c0' });
      window.updateData({
        electrics: { rpmTacho: 3200, maxrpm: 7000, watertemp: 91, gear: 'S3', modeName: 'sport', autoPlayUnitSystem: 'metric' },
        engineInfo: { redlineRPM: 7000, maxRPM: 7200 }
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
