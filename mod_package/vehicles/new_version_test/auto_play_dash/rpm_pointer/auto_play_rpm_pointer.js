//console.log("load gaugesScreen");
angular.module('gaugesScreen', [])

  .controller('GaugesScreenController', function ($scope, $element, $window) {
    "use strict";
    var vm = this;

    var svg;

    var power = { };
    var fuel = { };

    var ready = false;
    var currentGaugeMaxRPM = 0;
    var currentRedlineRPM = 0;

    // The original SVG was a 0-300 speedometer.  Its label positions therefore
    // do not match an integer RPM scale.  RPM labels are generated dynamically
    // at the exact needle angle for each integer x1000-RPM value.
    var SVG_NS = "http://www.w3.org/2000/svg";
    var SCALE_ARC_DEGREES = 300;
    var SCALE_START_DEGREES = 30;
    var SCALE_LABEL_RADIUS = 342;
    var SCALE_TICK_ARC_LENGTH = 2172.9349;
    var SCALE_TICK_DASH_LENGTH = 3.7088;

    function positiveNumber(value, fallback) {
      value = Number(value);
      return isFinite(value) && value > 0 ? value : fallback;
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function chooseGaugeMaxRPM(engineMaxRPM, redlineRPM) {
      var baseRPM = Math.max(engineMaxRPM || 0, redlineRPM || 0, 1000);
      var stepRPM;

      if (baseRPM <= 10000) {
        stepRPM = 1000;
      } else if (baseRPM <= 20000) {
        stepRPM = 2000;
      } else {
        stepRPM = 5000;
      }

      // Leave a small amount of headroom above the engine's maximum RPM so a
      // money-shift/overspeed does not put the needle exactly on the end stop.
      var headroomRPM = Math.max(stepRPM * 0.5, baseRPM * 0.05);
      var gaugeMaxRPM = Math.ceil((baseRPM + headroomRPM) / stepRPM) * stepRPM;

      if (gaugeMaxRPM <= baseRPM) {
        gaugeMaxRPM += stepRPM;
      }
      return gaugeMaxRPM;
    }

    function getScaleStepRPM(gaugeMaxRPM) {
      // Keep every visible label as an integer in x1000 RPM while avoiding
      // excessive label density on very high-revving engines.
      if (gaugeMaxRPM <= 12000) return 1000;
      if (gaugeMaxRPM <= 24000) return 2000;
      return 5000;
    }

    function ensureDynamicScale() {
      if (power.dynamicScaleLabels) return;

      // Hide the old 0/60/110/150/190/240/300 speedometer labels.
      if (power.scaleLabels) {
        for (var i = 0; i < power.scaleLabels.length; i++) {
          power.scaleLabels[i].style.display = 'none';
        }
      }

      var group = document.createElementNS(SVG_NS, 'g');
      group.setAttribute('id', 'rpm_dynamic_scale_labels');
      power.root.n.appendChild(group);
      power.dynamicScaleLabels = group;
    }

    function clearDynamicScale() {
      ensureDynamicScale();
      while (power.dynamicScaleLabels.firstChild) {
        power.dynamicScaleLabels.removeChild(power.dynamicScaleLabels.firstChild);
      }
    }

    function addScaleLabel(rpm, gaugeMaxRPM, redlineRPM) {
      var ratio = rpm / gaugeMaxRPM;
      var angle = -1 * (ratio * SCALE_ARC_DEGREES + SCALE_START_DEGREES) * (Math.PI / 180);
      var x = 512 + SCALE_LABEL_RADIUS * Math.sin(angle);
      var y = 512 + SCALE_LABEL_RADIUS * Math.cos(angle);

      var label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('class', 'rpm_scale_txt');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('x', x.toFixed(2));
      label.setAttribute('y', y.toFixed(2));
      label.setAttribute('style',
        'font-weight:350;font-size:35px;font-family:Kanit-SemiBold, Kanit;display:inline;fill:' +
        ((rpm >= redlineRPM && rpm > 0) ? '#ff0000' : '#ffffff'));
      label.textContent = Math.round(rpm / 1000).toString();
      power.dynamicScaleLabels.appendChild(label);
    }

    function updateScaleLabels(gaugeMaxRPM, redlineRPM) {
      clearDynamicScale();

      var stepRPM = getScaleStepRPM(gaugeMaxRPM);
      for (var rpm = 0; rpm <= gaugeMaxRPM; rpm += stepRPM) {
        addScaleLabel(rpm, gaugeMaxRPM, redlineRPM);
      }

      // The white scale ring is also recalculated.  Five small divisions are
      // used per numbered interval, so every numbered value sits exactly on a
      // scale mark instead of inheriting the old 300-km/h geometry.
      if (power.scaleTicks) {
        var smallStepRPM = stepRPM / 5;
        var tickPeriod = SCALE_TICK_ARC_LENGTH * smallStepRPM / gaugeMaxRPM;
        var tickGap = Math.max(0.1, tickPeriod - SCALE_TICK_DASH_LENGTH);
        power.scaleTicks.n.style.setProperty(
          'stroke-dasharray',
          SCALE_TICK_DASH_LENGTH.toFixed(4) + ' ' + tickGap.toFixed(4),
          'important'
        );
      }
    }

    function getRPMRange(data) {
      var info = data.engineInfo || {};
      var fallbackRedline = positiveNumber(data.electrics && data.electrics.maxrpm, 8000);
      var redlineRPM = positiveNumber(info.redlineRPM, fallbackRedline);
      var engineMaxRPM = positiveNumber(info.maxRPM, redlineRPM);
      var gaugeMaxRPM = chooseGaugeMaxRPM(engineMaxRPM, redlineRPM);

      return {
        redlineRPM: clamp(redlineRPM, 0, gaugeMaxRPM),
        gaugeMaxRPM: gaugeMaxRPM
      };
    }

    $scope.onSVGLoaded = function () {
      svg = $element[0].children[0].children[0];

      power.root = hu('#RPM', svg);
      power.rpm = hu("#rpm", power.root);
      power.rpm_txt = hu("#rpm_txt", power.root);
      power.pointer_0 = hu("#pointer_0", power.root);
      power.pointer_1 = hu("#pointer_1", power.root);

      power.redline = hu("#redline", power.root);
      power.scaleLabels = svg.querySelectorAll('.v_txt');
      power.scaleTicks = hu("#rpm_2", power.root);

      power.waterTemp = hu("#waterTemp", power.root);
      power.waterTemp_txt = hu("#waterTemp_txt", power.root);

      ready = true;
    }

    const invalidUnit = (unit) => {
      return typeof UiUnits[unit] !== 'function' && !customUnits.includes(unit)
    }

    $window.setup = (data) => {
      if(!ready){
        console.log("calling setup while svg not fully loaded");
        setTimeout(function(){ $window.setup(data) }, 100);
        return;
      }
    }

    $window.updateData = (data) => {
      var rpmRange = getRPMRange(data);
      var maxRPM = rpmRange.gaugeMaxRPM;
      var redline = rpmRange.redlineRPM;

      if (maxRPM !== currentGaugeMaxRPM || redline !== currentRedlineRPM) {
        updateScaleLabels(maxRPM, redline);
        currentGaugeMaxRPM = maxRPM;
        currentRedlineRPM = redline;
      }

      // Red section begins exactly at the engine/ECU redline and extends to
      // the automatically selected end of the tachometer scale.
      var redlineString = "0 " + ((2172.9349 / maxRPM) * redline).toString() + " 9999";
      power.redline.n.style.setProperty("stroke-dasharray", redlineString, "important");

      // RPM pointer.  Clamp only the graphical needle; the numeric RPM below
      // still displays the true value if the engine is over-revved.
      var rpm = Number(data.electrics.rpmTacho) || 0;
      var displayRPM = clamp(rpm, 0, maxRPM);
      var rpmAngle = -1 * (displayRPM * (300 / maxRPM) + 30) * (Math.PI / 180);

      power.pointer_0.attr({ x1: (512 + 362 * Math.sin(rpmAngle)).toString() });
      power.pointer_0.attr({ x2: (512 - 58 * Math.sin(rpmAngle)).toString() });
      power.pointer_0.attr({ y1: (512 + 362 * Math.cos(rpmAngle)).toString() });
      power.pointer_0.attr({ y2: (512 - 58 * Math.cos(rpmAngle)).toString() });

      power.pointer_1.attr({ x1: (512 + 362 * Math.sin(rpmAngle)).toString() });
      power.pointer_1.attr({ x2: (512 - 58 * Math.sin(rpmAngle)).toString() });
      power.pointer_1.attr({ y1: (512 + 362 * Math.cos(rpmAngle)).toString() });
      power.pointer_1.attr({ y2: (512 - 58 * Math.cos(rpmAngle)).toString() });

      var rpm_txt = (rpm / 1000 * 1.0).toFixed(1);
      if(rpm_txt == -0){
        rpm_txt = 0;
      }
      power.rpm_txt.text(rpm_txt);

      // waterTemp part
      var waterTemp = data.electrics.watertemp;
      var waterTempString = (waterTemp / 100.0 * 392.7).toString() + " 10000"; // full 392.7
      power.waterTemp.n.style.setProperty("stroke-dasharray", waterTempString, "important");
      power.waterTemp_txt.text((waterTemp * 1.0).toFixed(1));
    }
  })
