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
      power.velocity = hu("#velocity", power.root);
      power.velocity_txt = hu("#velocity_txt", power.root);

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
    
      var wheelspeed = data.electrics.wheelspeed / 0.2778
      var velocityString = (wheelspeed / 350 * 2093).toString() + " 10000"; // full 2617
      var redline = data.electrics.maxSpeed * 0.75;
      power.velocity.n.style.setProperty("stroke-dasharray", velocityString, "important");

      if(data.electrics.wheelspeed < redline){
        power.power_engine.n.style.setProperty("stroke", "#494540", "important");
      }
      else{
        power.power_engine.n.style.setProperty("stroke", "#ff0000", "important");
      }

      var velocity_txt = (wheelspeed * 1.0).toFixed(0);
      if(velocity_txt == -0){
        velocity_txt = 0;
      }
      power.velocity_txt.text(velocity_txt);
      
    }
  })