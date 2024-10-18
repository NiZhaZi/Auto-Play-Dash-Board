//console.log("load gaugesScreen");
angular.module('gaugesScreen', [])

  .controller('GaugesScreenController', function ($scope, $element, $window) {
    "use strict";
    var vm = this;

    var svg;

    var power = { };
    var fuel = { };

    var ready = false;

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

      // redline part
      var redline = data.electrics.maxrpm * 1.0;
      var maxRPM = Math.ceil(redline / 4000) * 4000;
      var redlineString = "0 " + ((2172.9349 / maxRPM) * redline).toString() + " 9999";
      power.redline.n.style.setProperty("stroke-dasharray", redlineString, "important");

    
      // velocity part
      var rpm = data.electrics.rpmTacho * 1.0;
      var rpmString = (rpm / maxRPM * 1963.5).toString() + " 10000"; // full 1963.5

      power.rpm.n.style.setProperty("stroke-dasharray", rpmString, "important");

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