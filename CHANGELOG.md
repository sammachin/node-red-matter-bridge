
# Change Log
All notable changes to this project will be documented in this file.
 
The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [0.12.0] -- 2024-01-19

### Added
#### Fan device
Added the Fan device type, also changed the color of the HVAC nodes (Fan, & Thermostat ) as I really didn't like the dark red

#### Battery Support
Further to the preview of Battery support in 0.11.3 I've refactored some of the code and given each device the option of having a Replacable or Rechargeable battery.
You can set the battery state on the device using a msg witha topic of `battery` and then the following msg values:
msg.battery.level = 0|1|2 For Ok, Low & Critical
msg.battery.percent = 0-100 Percentage of Battery
msg.battery.charge = 0|1 for Not charging or Charging (only on rechargeable type)

I'm not totally happy with the suport for battery state in the major controllers, The level value seems to work fairly well and the charging state on Apple & Google.
Indicating percentage seems to be very hit & miss, I need to do more testing to figure this out, feedback would be welcome here.
On Alexa it seems to only show either 100% for level ok or 0% for Low/Critical.

#### Topic for new Messages
Nodes that have an output now have an additional field that may be cofigured to set msg.topic when the node originates a message, eg the state has been changed by an external Matter controller.
This will not be used when the msg is from an input using passthrough.

### Changed
The bridge now supports a configurable storage location, see the README for details of how this can be changed, By default the package will continue to use the existing value of $HOME/.matter.
Changing this on a configured system without manually copying the files to the new location will result in errors.
If you are running Node-RED in a container like Docker then you will likely want to update this to a persistant file storage location.



## [0.11.4] - 2024-12-29
Bug Fix and Tuya

### Fixed
Added an initial colour mode to the color temp light device which was crashing if a state command was sent before any color temp was set.

### Added
Added the network commisioning cluster as Tuya ecosystems were expecting to find it on commisioning, however Tuya still non-functional as they don't support bridges.


## [0.11.3] = 2024-12-13
Preview release of Battery state/Powersource, and more robustness

### Fixed
The thermostat node has had its inputs refactored to allow setting of multiple values, mode, setPoint & temperature in a single message reliably, or any one or two of the values.
Inputs are now validated and errors (hopefully) caught so sending an invalid message shouldn't crash node-red
The sensor nodes can now output their cluster state (using node.error)

### Added
I've added "preview" support for the Power Source cluster on all devices, this means you can now check a box on the config marked 'battery' and the device will identify has having a rechargable battery to the controller.
At present only the status of the battery level can be set by sending in a message with a TOPIC of 'battery' and then a key of `msg.battery.batChargeLevel` and a value of either 0, 1 or 2. 0 Being "OK", 1 being "Low" and 2 being "Critical" 
Support for this across ecosystems and device types is still a bit patchy.

I've also added an "advanced" feature, if you send in a msg with a topic of `state` and no payload it will output the attributes of all the clusters, equally you can set a payload to correspond to the output cluster data or only certain parts of it and it will attempt to update those cluster attributes where allowed.
Note this is very much a low-level interface to the matter.js library and is mostly for debugging and development, you are advised to consult the matter spec documents to understand the possible values and which attributes may be changed.


## [0.11.2] - 2024-12-06
Fixes I should have spotted if I'd done 0.11.1 properly!

### Fixed
willUpdate not imported on some devices
missed the passthrough on doorLock
spotted a bug with step-change on level control when using 0-100 scale 

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
