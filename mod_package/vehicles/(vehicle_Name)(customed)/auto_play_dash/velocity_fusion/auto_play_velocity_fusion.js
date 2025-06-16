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
      power.pointer_0 = hu("#pointer_0", power.root);
      power.pointer_1 = hu("#pointer_1", power.root);

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
      var velocityAngle = -1 * (wheelspeed + 30) * (Math.PI / 180);
      var angleString = "rotate(" + velocityAngle.toString() + " 512 512)";
      var velocityString = (wheelspeed / 300 * 1963.5).toString() + " 10000"; // full 1963.5
      var redline = data.electrics.maxSpeed * 0.75;

      power.velocity.n.style.setProperty("stroke-dasharray", velocityString, "important");

      power.pointer_0.attr({ x1: (512 + 362 * Math.sin(velocityAngle)).toString() });
      power.pointer_0.attr({ x2: (512 - 58 * Math.sin(velocityAngle)).toString() });
      power.pointer_0.attr({ y1: (512 + 362 * Math.cos(velocityAngle)).toString() });
      power.pointer_0.attr({ y2: (512 - 58 * Math.cos(velocityAngle)).toString() });

      power.pointer_1.attr({ x1: (512 + 362 * Math.sin(velocityAngle)).toString() });
      power.pointer_1.attr({ x2: (512 - 58 * Math.sin(velocityAngle)).toString() });
      power.pointer_1.attr({ y1: (512 + 362 * Math.cos(velocityAngle)).toString() });
      power.pointer_1.attr({ y2: (512 - 58 * Math.cos(velocityAngle)).toString() });

      var velocity_txt = (wheelspeed * 1.0).toFixed(0);
      if(velocity_txt == -0){
        velocity_txt = 0;
      }
      power.velocity_txt.text(velocity_txt);


      // reColor part
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