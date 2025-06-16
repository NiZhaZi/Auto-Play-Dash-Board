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

      power.root = hu('#Velocity', svg);
      power.velocity = hu("#velocity", power.root);
      power.velocity_txt = hu("#velocity_txt", power.root);
      power.fuel = hu("#fuel", power.root);
      power.fuel_txt = hu("#fuel_txt", power.root);

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
    
      // velocity part
      var wheelspeed = data.electrics.wheelspeed * 3.6;
      var velocityString = (wheelspeed / 300 * 1963.5).toString() + " 10000"; // full 1963.5
      var redline = 150;
      power.velocity.n.style.setProperty("stroke-dasharray", velocityString, "important");

      var velocity_txt = (wheelspeed * 1.0).toFixed(0);
      if(velocity_txt == -0){
        velocity_txt = 0;
      }
      power.velocity_txt.text(velocity_txt);


      // reColor part
      var velocityAngle = -1 * (wheelspeed + 30) * (Math.PI / 180);
      // console.log(velocityAngle / (Math.PI / 180));
      var CorrectionValue = 0;
      if(velocityAngle <= -210 * (Math.PI / 180)){
        CorrectionValue = 1;
      }
      var endPosX = (1024 - 512 + Math.cos(90 * (Math.PI / 180) - velocityAngle) * 415).toFixed(4);
      var endPosY = (512 + Math.sin(90 * (Math.PI / 180) - velocityAngle) * 415).toFixed(4);
      var reColorM = "M 304.5000 871.4005 A 415 415 0 " + CorrectionValue.toString() + " 1 " + endPosX.toString() + " " + endPosY.toString();
      power.reColor.attr({ d: reColorM });


      // fuel part
      var fuel = data.electrics.fuel;
      var fuelString = (fuel * 392.7).toString() + " 10000"; // full 392.7
      power.fuel.n.style.setProperty("stroke-dasharray", fuelString, "important");
      power.fuel_txt.text((data.electrics.mileRange * 1.0).toFixed(1));
    }
  })