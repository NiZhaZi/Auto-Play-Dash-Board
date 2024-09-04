//console.log("load gaugesScreen");
angular.module('gaugesScreen', [])

  .controller('GaugesScreenController', function ($scope, $element, $window) {
    "use strict";
    var vm = this;

    var svg;

    var power = { };

    var ready = false;

    $scope.onSVGLoaded = function () {
      svg = $element[0].children[0].children[0];

      power.root = hu('#Info_3', svg);
      power.power_engine = hu("#power_engine", power.root);
      power.power_engine_txt = hu("#power_engine_txt", power.root);

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
    
      var rpmString = (data.electrics.rpmTacho / data.electrics.engineMaxRPM * 2093).toString() + " 10000"; // full 2617
      var redline = data.electrics.engineMaxRPM * 0.90;
      power.power_engine.n.style.setProperty("stroke-dasharray", rpmString, "important"); // engine RPM
      if(data.electrics.rpmTacho < 1){
        power.power_engine.n.style.setProperty("stroke", "#3c3c3c", "important");
      }
      else if(data.electrics.rpmTacho < redline){
        power.power_engine.n.style.setProperty("stroke", "#ff9100", "important");
      }
      else{
        power.power_engine.n.style.setProperty("stroke", "#ff0000", "important");
      }

      var engineRPM = (data.electrics.rpmTacho * 1.0).toFixed(0);
      if(engineRPM == -0){
        engineRPM = 0;
      }
      power.power_engine_txt.text(engineRPM);
      
    }
  })