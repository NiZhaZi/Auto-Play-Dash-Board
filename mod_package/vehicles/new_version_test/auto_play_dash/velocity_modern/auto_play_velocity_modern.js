(function () {
  'use strict';

  let ctx;
  let setupData = {};
  let latestData = { electrics: {} };

  function draw() {
    if (!ctx || !window.ModernCluster) return;
    const M = window.ModernCluster;
    const e = latestData.electrics || {};
    const unitSystem = M.resolveUnitSystem(e.autoPlayUnitSystem, setupData);
    const isImperial = unitSystem === 'imperial';

    const speedMS = Math.abs(Number(e.wheelspeed) || 0);
    const speed = speedMS * (isImperial ? 2.2369362920544 : 3.6);
    const maxSpeed = Number(isImperial ? setupData.maxSpeedImperial : setupData.maxSpeedMetric) || (isImperial ? 160 : 260);
    const unitLabel = isImperial ? 'mph' : 'km/h';
    const rangeKm = Math.max(0, Number(e.mileRange) || 0);
    const range = rangeKm * (isImperial ? 0.621371192237 : 1);
    const rangeUnit = isImperial ? 'mi' : 'km';
    const sweptMarkColor = '#0d1011';
    const themeColor = M.normalizeHexColor(setupData.themeColor, '#00d7c0');
    const themeHighlight = M.mixHex(themeColor, '#ffffff', 0.32);

    M.clearAndBackground(ctx, themeColor);
    M.drawSweepGlow(ctx, speed, maxSpeed, {
      innerRadius: 332,
      outerRadius: 444,
      segments: 72,
      tailColor: { r: 186, g: 192, b: 195, a: 0.22 },
      leadColor: { r: 250, g: 253, b: 253, a: 0.94 }
    });
    M.drawScale(ctx, {
      maxValue: maxSpeed,
      minorStep: 2,
      midStep: 10,
      majorStep: 20,
      labelRadius: 365,
      labelSize: 34,
      labelFormatter: v => Math.round(v).toString(),
      tickColor: v => v <= speed ? sweptMarkColor : '#e8eeee',
      labelColor: v => v <= speed ? sweptMarkColor : '#f5f7f7'
    });
    M.drawProgress(ctx, speed, maxSpeed, { color: themeColor });
    M.drawLowerBezelAccent(ctx);

    // Current-value highlight at the scale perimeter.
    const a = M.angleFor(speed, maxSpeed);
    M.line(ctx, 397, 447, a, 9, themeHighlight);

    // Main digital speed.
    M.text(ctx, Math.round(speed), 512, 510, 168, '#ffffff', 'center', 600);
    M.text(ctx, unitLabel, 512, 620, 52, '#d8dddd', 'center', 400);

    // Range readout: place the icon+text in the bottom opening of the OUTER scale ring,
    // matching the original cluster instead of putting it inside the center display well.
    const rangeText = `${Math.round(range)} ${rangeUnit}`;
    ctx.save();
    ctx.font = `400 36px Kanit, Arial, sans-serif`;
    const rangeWidth = ctx.measureText(rangeText).width;
    ctx.restore();
    const rangeGroupStart = 512 - ((46 + 13 + rangeWidth) / 2);
    ctx.save();
    ctx.translate(rangeGroupStart + 23, 854);
    ctx.scale(0.82, 0.82);
    M.drawFuelIcon(ctx, 0, 0);
    ctx.restore();
    M.text(ctx, rangeText, rangeGroupStart + 46 + 13, 858, 36, '#edf3f2', 'left', 400);
  }

  window.setup = function (data) {
    setupData = data || {};
    draw();
  };

  window.updateData = function (data) {
    latestData = data || { electrics: {} };
    draw();
  };

  function init() {
    const canvas = document.getElementById('gauge');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    draw();

    // Browser-only preview data. BeamNG immediately replaces this through updateData().
    if (typeof beamng === 'undefined') {
      window.setup({ uiUnitLength: 'metric', maxSpeedMetric: 260, maxSpeedImperial: 160, themeColor: '#00d7c0' });
      window.updateData({ electrics: { wheelspeed: 60 / 3.6, mileRange: 322, autoPlayUnitSystem: 'metric' } });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
