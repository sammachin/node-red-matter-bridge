
# Change Log
All notable changes to this project will be documented in this file.
 
The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).
## [0.11.1] - 2024-12-05
Fixes for functionality introduced in 0.11

### Added
Added api for re-opening commisioning from Node-RED, but not yet exposed in UI
### Changed
The passthrough logic has been improved and implemented on all nodes.


### Fixed
Bug with dimmable/color lights using the 0-100 scale that was causing an infinite loop & crash

Fixed the issue where devices were being removed and readded from ecosystems when nodes were restarted causing a loss of room assignments and automations


## [0.11.0] - 2024-12-01
Lots of improvements to core functionality and stablity

### Added
Disabled nodes & flows are now ignored and the bridge will cleanly start without them.

Can now choose Mired or Kelvin as the unit for light color temperatures.

Dimmable lights now have an increase/decrease level command with a configurable step level in the node.

### Changed
The behaviour of passthorugh has been changed on the on/off light, on/off socket & dimmable light to make it more consistent. As per issue https://github.com/sammachin/node-red-matter-bridge/issues/6
Other nodes have not yet had this change implemeted as it needs some field testing to see if its the right approach then I can tackle the more complex ones.

Interfaces that are internal (eg localhost) or only support IPv4 are removed from the interface selection, hopefully to avoid user confusion.

Major refactor to the event emmitters and close event to allow for deploying only modified nodes and not needing a full bridge restart.

Logging output has been improved to use Node-RED standard.

Server will only be started if it is not running avoiding a risk of dual servers

try/catch implemented on server start and endpoint add functions to reduce risk of a single config change crashing node-red.

Update to matter.js 0.11.8

Added a changelog!
### Fixed
Fixed a bug where the thermostat would always show a heat & cool mode even if only heat or cool was set.


## [0.10.1] - 2024-11-07
Fixes from user feedback
 
### Added
 
### Changed
 
### Fixed
 Fixes for handling of 0 values in temp and other inputs thanks @steve-mcl
 https://github.com/sammachin/node-red-matter-bridge/issues/7
 https://github.com/sammachin/node-red-matter-bridge/issues/8

Update to matter.js 0.10.6 to resolve a bug with level control when using Google Home controllers.
## [0.10.0] - 2024-11-05
  
Major Update

### Added
 Support for New Device Types
    Color Temperature Light
    Extended Colour Light (Full RGB)
    Contact Sensor
    Light Sensor
    Temperature Sensor
    Presure Sensor
    Humidity Sensor
    Occupancy Sensor
    Generic Switch (button)
    Simple Window Coverings (Blinds)
    Position Aware Window Coverings (Blinds)
    Thermostat
    Door Lock



### Changed
  
Moved to matter.js 0.10.0 which has a new API, consider this a breaking change from 0.0.8 and previous configuration will not work
  
## [0.0.8] - 2023-09-11

First public release,

Only support for on/off lights & sockets and dimmable lights.
Using matter.js 0.8.0 and unstable
