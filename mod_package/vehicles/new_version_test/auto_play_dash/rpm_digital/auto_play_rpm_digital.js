//console.log("load gaugesScreen");
angular.module('gaugesScreen', [])

  .controller('GaugesScreenController', function ($scope, $element, $window) {
    "use strict";
    var vm = this;

    var svg;

    var power = { };
    var fuel = { };

    var ready = false;

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

      var headroomRPM = Math.max(stepRPM * 0.5, baseRPM * 0.05);
      var gaugeMaxRPM = Math.ceil((baseRPM + headroomRPM) / stepRPM) * stepRPM;
      if (gaugeMaxRPM <= baseRPM) {
        gaugeMaxRPM += stepRPM;
      }
      return gaugeMaxRPM;
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
      power.fuel = hu("#fuel", power.root);
      power.fuel_txt = hu("#fuel_txt", power.root);

      power.redline = hu("#redline", power.root);

      power.waterTemp = hu("#waterTemp", power.root);
      power.waterTemp_txt = hu("#waterTemp_txt", power.root);

      power.reColor = hu("#reColor", power.root);

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

      var redlineString = "0 " + ((2172.9349 / maxRPM) * redline).toString() + " 9999";
      power.redline.n.style.setProperty("stroke-dasharray", redlineString, "important");

      var rpm = Number(data.electrics.rpmTacho) || 0;
      var displayRPM = clamp(rpm, 0, maxRPM);
      var rpmString = (displayRPM / maxRPM * 1963.5).toString() + " 10000"; // full 1963.5

      power.rpm.n.style.setProperty("stroke-dasharray", rpmString, "important");

      var rpm_txt = (rpm / 1000 * 1.0).toFixed(1);
      if(rpm_txt == -0){
        rpm_txt = 0;
      }
      power.rpm_txt.text(rpm_txt);

      var rpmAngle = -1 * (displayRPM * (300 / maxRPM) + 30) * (Math.PI / 180);
      var CorrectionValue = 0;
      if(rpmAngle <= -210 * (Math.PI / 180)){
        CorrectionValue = 1;
      }
      var endPosX = (1024 - 512 + Math.cos(90 * (Math.PI / 180) - rpmAngle) * 415).toFixed(4);
      var endPosY = (512 + Math.sin(90 * (Math.PI / 180) - rpmAngle) * 415).toFixed(4);
      var reColorM = "M 304.5000 871.4005 A 415 415 0 " + CorrectionValue.toString() + " 1 " + endPosX.toString() + " " + endPosY.toString();
      power.reColor.attr({ d: reColorM });

      var waterTemp = data.electrics.watertemp;
      var waterTempString = (waterTemp / 100.0 * 392.7).toString() + " 10000"; // full 392.7
      power.waterTemp.n.style.setProperty("stroke-dasharray", waterTempString, "important");
      power.waterTemp_txt.text((waterTemp * 1.0).toFixed(1));
    }
  })
