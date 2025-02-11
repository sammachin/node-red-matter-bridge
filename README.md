# Node-RED Matter Bridge

This package is designed to allow users to create a Matter Bridge and within that Bridge expose various virtual devices to their Matter controller (eg Apple Home, Google Home, Alexa etc)

The device nodes can then be used to connect to whatever non matter devices the user has in their home and translate the commands and data between them.

### Device Types
We currentlty support the following device types:
- On/Off Light
- On/Off Socket
- Dimmable Light
- Color Temperature Light
- Extended Colour Light (Full RGB)
- Contact Sensor
- Light Sensor
- Temperature Sensor
- Presure Sensor 
- Humidity Sensor
- Occupancy Sensor
- Generic Switch (button)
- Simple Window Coverings (Blinds)
- Position Aware Window Coverings (Blinds)
- Thermostat
- Door Lock
- Fan (added in 0.12)

These are the device types supported by most of the major controller platforms, not all controllers will support all device types and not all the features of a device are availble in all controllers.


### Passthrough
Device nodes that have an output (eg not sensors or switches) have an option in the config for `Passthrough Input msg to Output` The intention of this setting is to allow virtual devices to be updated by actual devices without creating a feedback loop.
The behaviour is as folllows:
Whenever a Matter Nodes state is changed from outside of Node-RED, eg using the Apple/Google/Amazon app then the node will output a new status value as a brand new message.
Whenever the node receives an input from another node then the node will only output the status if passthrough is set to true and will use the original message with an updated payload. This is consistent regardless of whether the device actual state changes so sending multiple ON messages will output multiple ON messages even if the device only updates once.

### Battery 
Each device has the option of setting a Replacable or Rechargeable battery, or None. 
This will then show a battery in the controller app (apple only shows the state if its low/critial nothing if its Ok)

You can set the battery state on the device using a msg witha topic of `battery` and then the following msg values:
msg.battery.level = 0|1|2 For Ok, Low & Critical
msg.battery.percent = 0-100 Percentage of Battery
msg.battery.charge = 0|1 for Not charging or Charging (only on rechargeable type)

I'm not totally happy with the suport for battery state in the major controllers, The level value seems to work fairly well and the charging state on Apple & Google.
Indicating percentage seems to be very hit & miss, I need to do more testing to figure this out, feedback would be welcome here.
On Alexa it seems to only show either 100% for level ok or 0% for Low/Critical.


### This is not a Controller
Note: This package is for creating virtual devices to control from a Matter Controller, if you are wanting to control your real matter hardware devices from node-red then take a look at  my  [node-red-matter-controller](https://flows.nodered.org/node/@sammachin/node-red-matter-controller) package instead.

### Matter
This is not a certified Matter device and is for development and experimentation only, for more information about Matter and to download the standards goto https://handbook.buildwithmatter.com


See the [CHANGELOG](https://github.com/sammachin/node-red-matter-bridge/blob/main/CHANGELOG.md) for details of each release
