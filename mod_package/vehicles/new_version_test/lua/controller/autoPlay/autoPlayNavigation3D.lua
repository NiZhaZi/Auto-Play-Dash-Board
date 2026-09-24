-- autoPlayNavigation3D.lua
-- 512x512 BeamNG navigation texture.
-- Uses the stock uiNavi stream while rendering the map in our custom HTML page.

local M = {}
M.type = "auxiliary"

local htmlTexture = require("htmlTexture")

local screenMaterialName = nil
local navTexture = nil
local updateTimer = 0
local updateInterval = 1 / 30
local nativeUpdateTimer = 0
local nativeUpdateInterval = 0.10
local fullMapRefreshTimer = 0
local fullMapRefreshInterval = 4.0
local mapZoom = 78
local initialized = false
local vehicleID = nil

local setupTimer = 0
local setupSent = false
local setupData = nil
local initialMapTimer = 0
local initialMapRequests = 0
local initialMapRequestLimit = 10

local function escapeLuaString(value)
  return string.format("%q", tostring(value or ""))
end

local function resolveHtmlPath(cfg)
  local explicitPath = cfg and (cfg.htmlFilePath or cfg.htmlPath)
  if explicitPath and explicitPath ~= "" then
    return explicitPath
  end

  local fileName = (cfg and cfg.fileName) or "navigation_3d/auto_play_navigation_3d.html"
  local vehicleDirectory = ""
  if v and v.data and v.data.vehicleDirectory then
    vehicleDirectory = tostring(v.data.vehicleDirectory)
  end

  vehicleDirectory = vehicleDirectory:gsub("\\", "/"):gsub("/+$", "")
  if vehicleDirectory ~= "" then
    if vehicleDirectory:sub(1, 1) ~= "/" then
      vehicleDirectory = "/" .. vehicleDirectory
    end
    return "local://local" .. vehicleDirectory .. "/auto_play_dash/" .. fileName
  end

  local vehicleName = cfg and tostring(cfg.vehicleName or "") or ""
  if vehicleName ~= "" then
    return "local://local/vehicles/" .. vehicleName .. "/auto_play_dash/" .. fileName
  end

  return "local://local/auto_play_dash/" .. fileName
end

local function requestMap(initMap)
  if not screenMaterialName then return end

  local initFlag = initMap and "true" or "false"
  local idArg = vehicleID and (", " .. tostring(vehicleID)) or ""
  local command =
    "if extensions and extensions.ui_uiNavi and extensions.ui_uiNavi.requestVehicleDashboardMap then " ..
    "extensions.ui_uiNavi.requestVehicleDashboardMap(" .. escapeLuaString(screenMaterialName) .. ", " .. initFlag .. idArg .. ") end"

  obj:queueGameEngineLua(command)
end

local function init(jbeamData)
  updateTimer = 0
  nativeUpdateTimer = 0
  fullMapRefreshTimer = 0
  initialized = false
  vehicleID = obj and obj:getID() or nil
  screenMaterialName = nil
  navTexture = nil
  setupTimer = 0
  setupSent = false
  setupData = nil
  initialMapTimer = 0
  initialMapRequests = 0
end

local function initSecondStage(jbeamData)
  local cfg = jbeamData or {}

  screenMaterialName = cfg.materialName or "@auto_play_screen_navigation"
  local htmlPath = resolveHtmlPath(cfg)
  local width = tonumber(cfg.displayWidth) or 512
  local height = tonumber(cfg.displayHeight) or 512
  local fps = math.max(1, tonumber(cfg.textureFPS) or 30)
  updateInterval = 1 / math.min(fps, 30)
  mapZoom = tonumber(cfg.mapZoom) or 150

  vehicleID = obj and obj:getID() or vehicleID
  navTexture = htmlTexture.new(screenMaterialName, htmlPath, width, height, fps)

  if not navTexture then
    log("E", "autoPlayNavigation3D", "Unable to create navigation HTML texture: " .. tostring(htmlPath))
    return
  end

  setupData = {
    mapPitch = tonumber(cfg.mapPitch) or 56,
    mapScale = tonumber(cfg.mapScale) or 1.24,
    mapYOffset = tonumber(cfg.mapYOffset) or 38,
    mapPerspective = tonumber(cfg.mapPerspective) or 520,
    mapZoom = mapZoom,
    mapTheme = tostring(cfg.mapTheme or 'dark'),
    themeColor = tostring(cfg.themeColor or '#00D7C0')
  }

  -- Give CEF time to finish parsing the page before calling setup/map.*.
  setupTimer = 0.30
  setupSent = false
  initialMapTimer = 0.65
  initialMapRequests = 0
  updateTimer = 0
  nativeUpdateTimer = 0
  fullMapRefreshTimer = fullMapRefreshInterval
  initialized = true
end

local function updateGFX(dt)
  if not initialized or not navTexture then return end

  if not setupSent then
    setupTimer = setupTimer - dt
    if setupTimer <= 0 then
      navTexture:callJS("setup", setupData or {})
      setupSent = true
    end
  end

  -- Never ask uiNavi to execute map.setData/map.updateData until the page has
  -- had time to install the global map object.
  if setupSent and initialMapRequests < initialMapRequestLimit then
    initialMapTimer = initialMapTimer - dt
    if initialMapTimer <= 0 then
      requestMap(true)
      initialMapRequests = initialMapRequests + 1
      initialMapTimer = 0.85
    end
  end

  if not setupSent or initialMapRequests == 0 then return end

  -- Keep BeamNG's native dashboard-map update stream alive.  requestVehicleDashboardMap
  -- with initmap=false queues map.updateData(...) for this exact HTML texture.  We do
  -- this without getUpdateUIflag(), because that flag can stay false for custom screens.
  nativeUpdateTimer = nativeUpdateTimer + dt
  if nativeUpdateTimer >= nativeUpdateInterval then
    nativeUpdateTimer = nativeUpdateTimer % nativeUpdateInterval
    requestMap(false)
  end

  -- Re-request the full road graph occasionally.  Some levels return an empty nodes
  -- table while the navigation graph is still starting up; a later request then fills it.
  fullMapRefreshTimer = fullMapRefreshTimer - dt
  if fullMapRefreshTimer <= 0 then
    requestMap(true)
    fullMapRefreshTimer = fullMapRefreshInterval
  end

  -- Direct Vehicle Lua position is retained as a fallback.  The HTML page prefers the
  -- native uiNavi update when one has arrived recently, so these two streams do not fight.
  updateTimer = updateTimer + dt
  if updateTimer < updateInterval then return end
  updateTimer = updateTimer % updateInterval

  local pos = obj:getPosition()
  local dir = obj:getDirectionVector()
  if pos and dir then
    local atan2 = math.atan2 or function(y, x) return math.atan(y, x) end
    local rotation = math.deg(atan2(-dir.x, dir.y))
    if rotation < 0 then rotation = rotation + 360 end

    local velocity = obj:getVelocity()
    local speed = 0
    if velocity then
      speed = math.sqrt((velocity.x or 0) * (velocity.x or 0) +
                        (velocity.y or 0) * (velocity.y or 0) +
                        (velocity.z or 0) * (velocity.z or 0))
    end

    navTexture:callJS("updateVehicle", {
      x = pos.x,
      y = pos.y,
      rotation = rotation,
      zoom = mapZoom,
      speed = speed,
      ignitionLevel = electrics and electrics.values and electrics.values.ignitionLevel or 2
    })
  end
end

local function reset()
  updateTimer = 0
  nativeUpdateTimer = 0
  fullMapRefreshTimer = 0.8
  setupTimer = 0.20
  setupSent = false
  initialMapTimer = 0.45
  initialMapRequests = 0
end

M.init = init
M.initSecondStage = initSecondStage
M.updateGFX = updateGFX
M.reset = reset

return M
