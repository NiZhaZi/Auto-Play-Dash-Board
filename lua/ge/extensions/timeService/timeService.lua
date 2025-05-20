local M = {}

local ENV = {}

local function onExtensionLoaded()

end

local function onUpdate(dt, dtSim)
    local tod = core_environment.getTimeOfDay()
    local sbn = core_environment.getSkyBrightness()

    be:sendToMailbox("timeService", tod.time)
end

local function timeService()
    return 1
end

M.timeService = timeService

M.onExtensionLoaded = onExtensionLoaded
M.onVehicleSwitched = onExtensionLoaded
M.onVehicleDestroyed = onExtensionLoaded
M.onVehicleSpawned = onExtensionLoaded
M.onClientPostStartMission = onExtensionLoaded
M.registerVehicle = onExtensionLoaded
M.onUpdate = onUpdate
return M