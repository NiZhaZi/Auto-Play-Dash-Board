-- digitalScreen.lua - 2024.8.20 22:13 - digital screen control
-- by NZZ
-- version 0.0.16 alpha
-- final edit - 2025.6.18 23:58

local M = {}

local abs = math.abs
local max = math.max
local min = math.min
local ceil = math.ceil
local floor = math.floor

local rpmToAV = 0.104719755
local avToRPM = 9.549296596425384
local torqueToPower = 0.0001404345295653085
local psToWatt = 735.499

local engine = nil

local motors = nil
local maxPower = nil
local maxRegen = nil

local centerDiff = nil
local frontDiff = nil
local rearDiff = nil

local battery = nil

local function timeStr(time)
    if time < 10 then
        return "0" .. tostring(time)
    else
        return tostring(time)
    end
end

local function updateGFX(dt)

    -- electrics.values.time = (os.date("%H") .. ":" .. os.date("%M")) or ""
    local time = tonumber(obj:getLastMailbox("timeService"))
    local tempTime
    local timeH
    local timeM
    if time then
        if time < 0.5 then
            tempTime = 24 * time + 12
        else
            tempTime = 24 * time - 12
        end
        timeH = floor(tempTime)
        timeM = floor((tempTime - timeH) * 60)
    end

    electrics.values.time = (timeStr(timeH) .. ":" .. timeStr(timeM)) or ":"

    -- electrics.values.temperature = tostring(floor(obj:getEnvTemperature() - 273.15 + 0.5) or 0) .. "℃"
    electrics.values.temperature = obj:getEnvTemperature()

    local timeH12
    if timeH < 12 then
        timeH12 = timeH
    else
        timeH12 = timeH - 12
    end

    electrics.values.hourNeedle = min(timeH12 * 30 + timeM * 0.5, 360)
    electrics.values.minuNeedle = timeM * 6

    local power = 0
    local regen = 0
    for _, v in ipairs(motors) do
        power = power + (v.motorTorque or v.outputTorque1) * v.outputAV1 * v.motorDirection * avToRPM * (v.motorRatio or 1) / 9549
        regen = regen + v.outputTorque1
    end
    local motorPowerRatio = max(0, ceil(power / maxPower * 100))
    local motorRegenRatio = -1 * max(-100, min(0, floor(regen / maxRegen * 100)))
    motorPowerRatio = abs(motorPowerRatio)
    motorRegenRatio = abs(motorRegenRatio)
    electrics.values.motorPower = power
    electrics.values.motorPowerRatio = motorPowerRatio
    electrics.values.motorRegenRatio = motorRegenRatio

    -- log("D", "digitalScreen.lua(line50)", "motorPowerRatio" .. motorPowerRatio)
    -- log("D", "digitalScreen.lua(line51)", "motorRegenRatio" .. motorRegenRatio)

    if battery then
        electrics.values.batteryVolume = battery.storedEnergy / 3600000
        if not electrics.values.evfuel or electrics.values.evfuel ~= battery.remainingRatio * 100 then
            electrics.values.evfuel = battery.remainingRatio * 100
        end
        electrics.values.ebrake = electrics.values.brake * max(electrics.values.ignitionLevel - 1, 0)
    else
        electrics.values.batteryVolume = 0
    end

    if electrics.values.ignitionLevel == 2 then
        electrics.values.singleMile = electrics.values.singleMile + electrics.values.wheelspeed * dt / 1000
    else
        electrics.values.singleMile = 0
    end

    if centerDiff and frontDiff and rearDiff then
        electrics.values.awdFL = (centerDiff.diffTorqueSplitB or centerDiff.outputTorque2) * frontDiff.diffTorqueSplitA
        electrics.values.awdFR = (centerDiff.diffTorqueSplitB or centerDiff.outputTorque2) * frontDiff.diffTorqueSplitB
        electrics.values.awdRL = (centerDiff.diffTorqueSplitA or centerDiff.outputTorque1) * rearDiff.diffTorqueSplitA
        electrics.values.awdRR = (centerDiff.diffTorqueSplitA or centerDiff.outputTorque1) * rearDiff.diffTorqueSplitB
    elseif frontDiff and rearDiff then
        electrics.values.awdFL = 1 * frontDiff.diffTorqueSplitA
        electrics.values.awdFR = 1 * frontDiff.diffTorqueSplitB
        electrics.values.awdRL = 1 * rearDiff.diffTorqueSplitA
        electrics.values.awdRR = 1 * rearDiff.diffTorqueSplitB
    elseif frontDiff then
        electrics.values.awdFL = 1 * frontDiff.diffTorqueSplitA
        electrics.values.awdFR = 1 * frontDiff.diffTorqueSplitB
        electrics.values.awdRL = 0
        electrics.values.awdRR = 0
    elseif rearDiff then
        electrics.values.awdFL = 0
        electrics.values.awdFR = 0
        electrics.values.awdRL = 1 * rearDiff.diffTorqueSplitA
        electrics.values.awdRR = 1 * rearDiff.diffTorqueSplitB
    else
        electrics.values.awdFL = 0.25
        electrics.values.awdFR = 0.25
        electrics.values.awdRL = 0.25
        electrics.values.awdRR = 0.25
    end

    if electrics.values.hybridMode == "hybrid" then
        electrics.values.hybridModeTxt = "HEV"
    elseif electrics.values.hybridMode == "electric" then
        electrics.values.hybridModeTxt = "EV"
    elseif electrics.values.hybridMode == "auto" then
        electrics.values.hybridModeTxt = "AUTO"
    elseif electrics.values.hybridMode == "reev" then
        electrics.values.hybridModeTxt = "REEV"
    elseif electrics.values.hybridMode == "fuel" then
        electrics.values.hybridModeTxt = "ICE"
    else
        electrics.values.hybridModeTxt = "none"
    end

    local driveMode = controller.getControllerSafe("driveModes").getCurrentDriveModeKey()
    electrics.values.modeName = driveMode
    if driveMode == "comfort" then
        electrics.values.modeColor = "#238be6"
    elseif driveMode == "eco" then
        electrics.values.modeColor = "#00ff00"
    elseif driveMode == "sport" then
        electrics.values.modeColor = "#ffff00"
    elseif driveMode == "corsa" then
        electrics.values.modeColor = "#ff0000"
    elseif driveMode == "offroad" then
        electrics.values.modeColor = "#f5a442"
    elseif driveMode == "off" then
        electrics.values.modeColor = "#dcdcdc"
    else
        electrics.values.modeColor = "#3c3c3c"
    end

    local consumption = controller.getControllerSafe("vehicleInfo").averageConsum
    local range = controller.getControllerSafe("vehicleInfo").range

    if consumption.fuel < 1000 then
        electrics.values.comsuFuel = consumption.fuel
    else
        electrics.values.comsuFuel = 0
    end
    electrics.values.comsuBattery = consumption.electricity
    electrics.values.mileRange = range.rest

    if electrics.values.gear ~= "R" then
        electrics.values.consoleScreen = math.min(electrics.values.ignitionLevel / 2, 1)
    else
        electrics.values.consoleScreen = electrics.values.ignitionLevel
    end

end

local function init(jbeamData)

    -- electrics.values.time = (os.date("%H") .. ":" .. os.date("%M")) or ""
    obj:queueGameEngineLua('extensions.load("timeService_timeService")')
    electrics.values.tamperature = obj:getEnvTemperature() - 273.15 or 0

    maxPower = 0
    maxRegen = 0

    engine = powertrain.getDevice("mainEngine")
    if engine then
        electrics.values.engineMaxRPM = engine.maxRPM
    else
        electrics.values.engineMaxRPM = 0
    end
    electrics.values.maxSpeed = jbeamData.maxSpeed or 350
    electrics.values.singleMile = 0

    motors = {}
    for _, v in pairs(powertrain.getDevicesByType("electricMotor")) do
        table.insert(motors, v)
        maxPower = maxPower + v.maxPower
        maxRegen = maxRegen + v.maxRegenTorque
    end
    for _, v in pairs(powertrain.getDevicesByType("motorShaft")) do
        table.insert(motors, v)
        maxPower = maxPower + v.maxPower
        maxRegen = maxRegen + v.maxRegenTorque
    end

    maxPower = maxPower * 0.7355

    electrics.values.maxPower = maxPower

    local diffName = jbeamData.diffName or "transferCase" or "transfercase"
    local frontDifferentialName = jbeamData.frontDifferentialName or "frontDiff"
	local rearDifferentialName = jbeamData.rearDifferentialName or "rearDiff"
	centerDiff = powertrain.getDevice(diffName)
    frontDiff = powertrain.getDevice(frontDifferentialName)
    rearDiff = powertrain.getDevice(rearDifferentialName)
    electrics.values.awdFL = 0
    electrics.values.awdFR = 0
    electrics.values.awdRL = 0
    electrics.values.awdRR = 0

    local batteryName =  jbeamData.energyStorage or "mainBattery"
    battery = energyStorage.getStorage(batteryName)

    if electrics.values.gear ~= "R" then
        electrics.values.consoleScreen = electrics.values.ignitionLevel / 2
    else
        electrics.values.consoleScreen = electrics.values.ignitionLevel
    end

end

local function reset()
    electrics.values.singleMile = 0
end

M.updateGFX = updateGFX
M.init = init
M.reset = reset

return M