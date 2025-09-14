//console.log("load gaugesScreen");
angular.module('gaugesScreen', [])

  .controller('GaugesScreenController', function ($scope, $element, $window) {
    "use strict";
    var vm = this;

    var svg;

    var cellsDescription = {};

    var electrics = { };
    var velocity = { };
    var fuel = { };
    var battery = { };
    var power = { };
    var signal = {};
    var awd = {};
    var environment = {};

    var velocityUnit;
    var fuelUnit;
    var GalRegion;
    var fuelConsumptionUnit;
    var fuelConsumptionRegion;
    var batteryConsumptionUnit;
    var batteryConsumptionRegion;
    var temperatureUnit;

    var ready = false;
    // var customUnits= ["",undefined,"bool","gear","pressureFromPsi","light"]

    $scope.onSVGLoaded = function () {
      svg = $element[0].children[0].children[0];

      electrics.velo_stop0 = hu("#velocity_stop_0", svg);
      electrics.velo_stop1 = hu("#velocity_stop_1", svg);
      electrics.velo_stop2 = hu("#velocity_stop_2", svg);

      electrics.fuel_stop0 = hu("#fuel_stop_0", svg);
      electrics.fuel_stop1 = hu("#fuel_stop_1", svg);
      electrics.fuel_stop2 = hu("#fuel_stop_2", svg);

      electrics.battery_stop_0 = hu("#battery_stop_0", svg);
      electrics.battery_stop_1 = hu("#battery_stop_1", svg);
      electrics.battery_stop_2 = hu("#battery_stop_2", svg);

      electrics.wt_stop_0 = hu("#wt_stop_0", svg);
      electrics.wt_stop_1 = hu("#wt_stop_1", svg);
      electrics.wt_stop_2 = hu("#wt_stop_2", svg);

      electrics.ot_stop_0 = hu("#ot_stop_0", svg);
      electrics.ot_stop_1 = hu("#ot_stop_1", svg);
      electrics.ot_stop_2 = hu("#ot_stop_2", svg);

      electrics.fl_stop_0 = hu("#fl_stop_0", svg);
      electrics.fl_stop_1 = hu("#fl_stop_1", svg);
      electrics.fl_stop_2 = hu("#fl_stop_2", svg);

      electrics.fr_stop_0 = hu("#fr_stop_0", svg);
      electrics.fr_stop_1 = hu("#fr_stop_1", svg);
      electrics.fr_stop_2 = hu("#fr_stop_2", svg);
      
      electrics.rl_stop_0 = hu("#rl_stop_0", svg);
      electrics.rl_stop_1 = hu("#rl_stop_1", svg);
      electrics.rl_stop_2 = hu("#rl_stop_2", svg);

      electrics.rr_stop_0 = hu("#rr_stop_0", svg);
      electrics.rr_stop_1 = hu("#rr_stop_1", svg);
      electrics.rr_stop_2 = hu("#rr_stop_2", svg);

      velocity.root = hu('#Info_0', svg);
      velocity.velocity = hu("#velocity", velocity.root);
      velocity.velocity_txt = hu("#velocity_txt", velocity.root);
      velocity.velocity_unit_txt = hu("#velocity_unit_txt", velocity.root);
      velocity.gear_txt = hu("#gear_txt", velocity.root);
      velocity.hybrid_mod_txt = hu("#hybrid_mod_txt", velocity.root);
      velocity.mode_txt = hu("#mode_txt", velocity.root);
      velocity.range_txt = hu("#range_txt", velocity.root);
      velocity.range_unit_txt = hu("#range_unit_txt", velocity.root);

      fuel.root = hu('#Info_1', svg);
      fuel.fuel = hu("#fuel", fuel.root);
      fuel.fuel_txt = hu("#fuel_txt", fuel.root);
      fuel.fuel_unit_txt = hu("#fuel_unit_txt", fuel.root);
      fuel.fuel_desc_txt = hu("#fuel_desc_txt", fuel.root);
      fuel.fuel_consumption_txt = hu("#fuel_consumption_txt", fuel.root);
      fuel.fuel_consumption_unit_txt = hu("#fuel_consumption_unit_txt", fuel.root);
      
      battery.root = hu('#Info_2', svg);
      battery.battery = hu("#battery", battery.root);
      battery.battery_txt = hu("#battery_txt", battery.root);
      battery.battery_unit_txt = hu("#battery_unit_txt", battery.root);
      battery.battery_desc_txt = hu("#battery_desc_txt", battery.root);
      battery.battery_consumption_txt = hu("#battery_consumption_txt", battery.root);
      battery.battery_consumption_unit_txt = hu("#battery_consumption_unit_txt", battery.root);

      power.root = hu('#Info_3', svg);
      power.power_motor_p = hu("#power_motor_p", power.root);
      power.power_motor_m = hu("#power_motor_m", power.root);
      power.power_engine = hu("#power_engine", power.root);
      power.power_motor_txt = hu("#power_motor_txt", power.root);
      power.power_motor_unit_txt = hu("#power_motor_unit_txt", power.root);
      power.power_engine_txt = hu("#power_engine_txt", power.root);
      power.power_engine_unit_txt = hu("#power_engine_unit_txt", power.root);
      power.mile_txt = hu("#mile_txt", power.root);
      power.mile_unit_txt = hu("#mile_unit_txt", power.root);

      signal.root = hu('#Info_4', svg);
      signal.light_lowbeam = hu("#light_lowbeam", signal.root);
      signal.light_highbeam = hu("#light_highbeam", signal.root);
      signal.fuel_logo = hu("#fuel_logo", signal.root);
      signal.battery_logo = hu("#battery_logo", signal.root);
      signal.light_checkengine = hu("#light_checkengine", signal.root);
      signal.light_lowpressure = hu("#light_lowpressure", signal.root);
      signal.signal_right = hu("#signal_right", signal.root);
      signal.signal_left = hu("#signal_left", signal.root);
      signal.signal_flash = hu("#signal_flash", signal.root);
      signal.signal_p_brake = hu("#signal_p_brake", signal.root);
      signal.signal_auto_hold = hu("#signal_auto_hold", signal.root);
      signal.abs_txt = hu("#abs_txt", signal.root);
      signal.tcs_txt = hu("#tcs_txt", signal.root);
      signal.esc_txt = hu("#esc_txt", signal.root);

      environment.root = hu('#Info_6', svg);
      environment.time = hu("#time", environment.root);
      environment.temperature = hu("#temperature", environment.root);
      
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

      cellsDescription = data.cells;

      if ("temperature" in cellsDescription){
        temperatureUnit = cellsDescription.temperature.unit;
      }else{

      }

      if ("velocity" in cellsDescription){
        velocity.velocity_unit_txt.text(cellsDescription.velocity.unit);
        velocityUnit = cellsDescription.velocity.unit;
        if(cellsDescription.velocity.unit == "MPH"){
          velocity.range_unit_txt.text("miles range");
          power.mile_unit_txt.text("miles")
        }
        else{
          velocity.range_unit_txt.text("km range");
          power.mile_unit_txt.text("km")
        }
      }else{

      }

      if ("fuelConsumption" in cellsDescription){
        fuelConsumptionUnit = cellsDescription.fuelConsumption.consumptionUnit;
        fuel.fuel_consumption_unit_txt.text(cellsDescription.fuelConsumption.consumptionUnit);
        if(cellsDescription.fuelConsumption.consumptionUnit == "MPG"){
          fuelConsumptionRegion = cellsDescription.fuelConsumption.consumptionRegion;
        }
      }else{

      }

      if ("fuel" in cellsDescription){
        fuel.fuel_txt.text(cellsDescription.fuel.path);
        fuel.fuel_unit_txt.text(cellsDescription.fuel.unit);
        fuelUnit = cellsDescription.fuel.unit;
        if(cellsDescription.fuel.unit == "Gal"){
          GalRegion = cellsDescription.fuel.region;
        }
      }else{
        electrics.fuel_stop0.css({"stop-color": "#3c3c3c"} );
        signal.fuel_logo.css({"fill": "none"} );
        electrics.fuel_stop0.n.setAttribute("offset", 0 );
        electrics.fuel_stop1.n.setAttribute("offset", 0 );
        fuel.fuel_txt.text("");
        fuel.fuel_unit_txt.text("")
        fuel.fuel_desc_txt.text("");
        fuel.fuel_consumption_txt.text("");
        fuel.fuel_consumption_unit_txt.text("");
      }

      if ("batteryConsumption" in cellsDescription){
        batteryConsumptionUnit = cellsDescription.batteryConsumption.consumptionUnit;
        battery.battery_consumption_unit_txt.text(cellsDescription.batteryConsumption.consumptionUnit);
      }else{
        
      }

      if ("battery" in cellsDescription){
        battery.battery_txt.text(cellsDescription.battery.path);
        battery.battery_unit_txt.text(cellsDescription.battery.unit);
      }else{
        electrics.battery_stop_0.css({"stop-color": "#3c3c3c"} );
        signal.battery_logo.css({"fill": "none"} );
        electrics.battery_stop_0.n.setAttribute("offset", 0 );
        electrics.battery_stop_1.n.setAttribute("offset", 0 );
        battery.battery_txt.text("");
        battery.battery_unit_txt.text("")
        battery.battery_desc_txt.text("");
        battery.battery_consumption_txt.text("");
        battery.battery_consumption_unit_txt.text("");
      }

      if ("awd" in cellsDescription){
        electrics.fl_stop_0.css({"stop-color": "#ff0000"} );
        electrics.fr_stop_0.css({"stop-color": "#ff0000"} );
        electrics.rl_stop_0.css({"stop-color": "#ff0000"} );
        electrics.rr_stop_0.css({"stop-color": "#ff0000"} );
      }else{
        electrics.fl_stop_0.css({"stop-color": "#3c3c3c"} );
        electrics.fr_stop_0.css({"stop-color": "#3c3c3c"} );
        electrics.rl_stop_0.css({"stop-color": "#3c3c3c"} );
        electrics.rr_stop_0.css({"stop-color": "#3c3c3c"} );
      }

      if ("rpm" in cellsDescription){
        power.power_engine.n.style.setProperty("stroke", "#ff9100", "important");
        power.power_engine_unit_txt.text(cellsDescription.rpm.unit);
      }else{
        power.power_engine.n.style.setProperty("stroke", "#3c3c3c", "important");
        power.power_engine_txt.text("");
        power.power_engine_unit_txt.text("");
      }

      if ("power" in cellsDescription){
        power.power_motor_p.n.style.setProperty("stroke", "#0000ff", "important");
        power.power_motor_m.n.style.setProperty("stroke", "#00ff00", "important");
        power.power_motor_unit_txt.text(cellsDescription.power.unit);
      }else{
        power.power_motor_p.n.style.setProperty("stroke", "#3c3c3c", "important");
        power.power_motor_m.n.style.setProperty("stroke", "#3c3c3c", "important");
        power.power_motor_txt.text("");
        power.power_motor_unit_txt.text("");
      }

      if ("" in cellsDescription){

      }else{

      }

    }

    $window.updateData = (data) => {
    
      electrics.velo_stop0.n.setAttribute("offset", data.electrics.wheelspeed * 3.6 / data.electrics.maxSpeed + 0.001 );
      electrics.velo_stop1.n.setAttribute("offset", data.electrics.wheelspeed * 3.6 / data.electrics.maxSpeed - 0.001 );
      if(data.electrics.wheelspeed * 3.6 > 150){
        electrics.velo_stop0.css({"stop-color": "#ff0000"});
      }
      else{
        electrics.velo_stop0.css({"stop-color": "#00ffff"});
      }
      
      if(velocityUnit == "MPH"){
        velocity.velocity_txt.text((data.electrics.wheelspeed * 2.24).toFixed(0));
      }
      else{
        velocity.velocity_txt.text((data.electrics.wheelspeed * 3.60).toFixed(0));
      }
      
      if(data.electrics.gear == "D"){
        velocity.gear_txt.text(data.electrics.gear + data.electrics.gearIndex);
      }
      else{
        velocity.gear_txt.text(data.electrics.gear);
      }

      velocity.hybrid_mod_txt.text(data.electrics.hybridModeTxt);
      if(data.electrics.hybridModeTxt == "AUTO"){
        velocity.hybrid_mod_txt.n.setAttribute("fill", "#33aaff" );
      }
      else if(data.electrics.hybridModeTxt == "HEV"){
        velocity.hybrid_mod_txt.n.setAttribute("fill", "#0000ff" );
      }
      else if(data.electrics.hybridModeTxt == "EV"){
        velocity.hybrid_mod_txt.n.setAttribute("fill", "#00ff00" );
      }
      else if(data.electrics.hybridModeTxt == "REEV"){
        velocity.hybrid_mod_txt.n.setAttribute("fill", "#00ffff" );
      }
      else if(data.electrics.hybridModeTxt == "ICE"){
        velocity.hybrid_mod_txt.n.setAttribute("fill", "#ffff00" );
      }
      else{
        velocity.hybrid_mod_txt.n.setAttribute("fill", "#ffffff" );
      }
      velocity.mode_txt.text(data.electrics.modeName.toUpperCase()).css({"fill": data.electrics.modeColor});

      if(velocityUnit == "MPH"){
        velocity.range_txt.text((data.electrics.mileRange * 0.6214).toFixed(1));
      }
      else{
        velocity.range_txt.text((data.electrics.mileRange * 1.0).toFixed(1));
      }      

      
      if ("fuel" in cellsDescription){
        if(data.electrics.fuel < 0.1){
          electrics.fuel_stop0.css({"stop-color": "#ff0000"} );
          signal.fuel_logo.css({"fill": "#ff0000"} );
        }
        else{
          electrics.fuel_stop0.css({"stop-color": "#0000ff"} );
          signal.fuel_logo.css({"fill": "#ffffff"} );
        }
        electrics.fuel_stop0.n.setAttribute("offset", data.electrics.fuel - 0.001 );
        electrics.fuel_stop1.n.setAttribute("offset", data.electrics.fuel + 0.001 );

        if(fuelUnit == "Gal"){
          if(GalRegion == "US"){
            fuel.fuel_txt.text((data.electrics.fuelVolume * 0.264).toFixed(0));
          }
          else if(GalRegion == "UK"){
            fuel.fuel_txt.text((data.electrics.fuelVolume * 0.220).toFixed(0));
          }
        }
        else{
          fuel.fuel_txt.text((data.electrics.fuelVolume * 1.0).toFixed(0));
        }
        
        if(fuelConsumptionUnit == "MPG"){
          if(fuelConsumptionRegion == "US"){
            fuel.fuel_consumption_txt.text((235.21 / data.electrics.comsuFuel).toFixed(1));
          }
          else if(fuelConsumptionRegion == "UK"){
            fuel.fuel_consumption_txt.text((282.48 / data.electrics.comsuFuel).toFixed(1));
          }
        }
        else{
          fuel.fuel_consumption_txt.text((data.electrics.comsuFuel * 1.0).toFixed(1));
        }
        
      }
      

      if ("battery" in cellsDescription){
        if(data.electrics.evfuel < 10){
          electrics.battery_stop_0.css({"stop-color": "#ff0000"} );
          signal.battery_logo.css({"fill": "#ff0000"} );
        }
        else{
          electrics.battery_stop_0.css({"stop-color": "#00ff00"}  );
          signal.battery_logo.css({"fill": "#ffffff"} );
        }
        electrics.battery_stop_0.n.setAttribute("offset", data.electrics.evfuel / 100 - 0.001 );
        electrics.battery_stop_1.n.setAttribute("offset", data.electrics.evfuel / 100 + 0.001 );
        battery.battery_txt.text((data.electrics.batteryVolume * 1.0).toFixed(0));

        if(batteryConsumptionUnit == "MPGe"){
          battery.battery_consumption_txt.text((data.electrics.comsuBattery * 2094.33).toFixed(1));
        }
        else{
          battery.battery_consumption_txt.text((data.electrics.comsuBattery * 1.0).toFixed(1));
        }
        
      }
      
      if ("rpm" in cellsDescription){
        var rpmString = (data.electrics.rpmTacho / data.electrics.engineMaxRPM * 2617).toString() + " 10000"; // full 2617
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
      
      if ("power" in cellsDescription){
        var displayPower = data.electrics.motorPower / data.electrics.maxPower * (2198 / 2); // full 2198
        var powerStringP = (Math.max(displayPower, 0)).toString() + " 10000";
        var powerStringM = (-1 * Math.min(displayPower, 0)).toString() + " 10000";
        power.power_motor_p.n.style.setProperty("stroke-dasharray", powerStringP, "important"); // motor output power
        if(Math.max(displayPower, 0) < 1){
          power.power_motor_p.n.style.setProperty("stroke", "#3c3c3c", "important");
        }
        else if(data.electrics.motorPower < data.electrics.maxPower / 2){
          power.power_motor_p.n.style.setProperty("stroke", "#00ff00", "important");
        }
        else{
          power.power_motor_p.n.style.setProperty("stroke", "#ff0000", "important");
        }
        power.power_motor_m.n.style.setProperty("stroke-dasharray", powerStringM, "important"); // motor regen power
        if(-1 * Math.min(displayPower, 0) < 1){
          power.power_motor_m.n.style.setProperty("stroke", "#3c3c3c", "important");
        }
        else{
          power.power_motor_m.n.style.setProperty("stroke", "#0000ff", "important");
        }
        var motorPower = (data.electrics.motorPower * 1.0).toFixed(0);
        if(motorPower == -0){
          motorPower = 0;
        }
        power.power_motor_txt.text(motorPower);
      }

      var mile;
      if(velocity.velocity_unit_txt == "MPH"){
        mile = (data.electrics.singleMile * 0.6214).toFixed(1)
      }
      else{
        mile = (data.electrics.singleMile * 1.0).toFixed(1)
      }
      power.mile_txt.text(mile);

      signal.light_checkengine.n.setAttribute("opacity", data.electrics.checkengine );
      signal.light_lowpressure.n.setAttribute("opacity", data.electrics.lowpressure );
      signal.light_lowbeam.n.setAttribute("opacity", data.electrics.lowbeam );
      signal.light_highbeam.n.setAttribute("opacity", data.electrics.highbeam );
      signal.signal_left.n.setAttribute("opacity", data.electrics.signal_L );
      signal.signal_right.n.setAttribute("opacity", data.electrics.signal_R );
      signal.signal_flash.n.setAttribute("opacity", data.electrics.signal_L * data.electrics.signal_R );
      signal.signal_p_brake.n.setAttribute("opacity", data.electrics.parkingbrake );
      if(data.electrics.autohold == 0){
        signal.signal_auto_hold.n.setAttribute("fill", "#3c3c3c" );
      }
      else{
        if(data.electrics.autoholdActive == 0){
          signal.signal_auto_hold.n.setAttribute("fill", "#ffffff" );
        }
        else{
          signal.signal_auto_hold.n.setAttribute("fill", "#ff0000" );
        }
      }
      signal.abs_txt.n.setAttribute("opacity", data.electrics.hasABS * data.electrics.absActive );
      signal.tcs_txt.n.setAttribute("opacity", data.electrics.hasTCS * data.electrics.tcsActive );
      signal.esc_txt.n.setAttribute("opacity", data.electrics.hasESC * data.electrics.escActive );

      if ("awd" in cellsDescription){
        electrics.fl_stop_0.n.setAttribute("offset", data.electrics.awdFL + 0.001 );
        electrics.fl_stop_1.n.setAttribute("offset", data.electrics.awdFL - 0.001 );
        electrics.fr_stop_0.n.setAttribute("offset", data.electrics.awdFR + 0.001 );
        electrics.fr_stop_1.n.setAttribute("offset", data.electrics.awdFR - 0.001 );
        electrics.rl_stop_0.n.setAttribute("offset", data.electrics.awdRL + 0.001 );
        electrics.rl_stop_1.n.setAttribute("offset", data.electrics.awdRL - 0.001 );
        electrics.rr_stop_0.n.setAttribute("offset", data.electrics.awdRR + 0.001 );
        electrics.rr_stop_1.n.setAttribute("offset", data.electrics.awdRR - 0.001 );
      }

      electrics.wt_stop_0.n.setAttribute("offset", data.electrics.watertemp /200 + 0.001 );
      electrics.wt_stop_1.n.setAttribute("offset", data.electrics.watertemp /200 - 0.001 );

      electrics.ot_stop_0.n.setAttribute("offset", data.electrics.oiltemp / 200 + 0.001 );
      electrics.ot_stop_1.n.setAttribute("offset", data.electrics.oiltemp / 200 - 0.001 );

      environment.time.text(data.electrics.time);
      var formedTemp;
      if(temperatureUnit == "C"){
        formedTemp = (data.electrics.temperature - 273.15).toFixed(0).toString() + "℃"
      }
      else if(temperatureUnit == "F"){
        formedTemp = ((data.electrics.temperature - 273.15) * 9 / 5 + 32).toFixed(0).toString() + "℉"
      }
      else{
        formedTemp = data.electrics.temperature.toFixed(0).toString() + "K"
      }
      environment.temperature.text(formedTemp);
      
    }
  })