# Node-RED Matter Bridge

This package is designed to allow users to create a Matter Bridge and within that Bridge expose various virtual devices to their Matter controller (eg Apple Home, Google Home, Alexa etc)

The device nodes can then be used to connect to whatever non matter devices the user has in their home and translate the commands and data between them.

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

These are the device types supported by most of the major controller platforms, not all controllers will support all device types and not all the features of a device are availble in all controllers.

Note: This package is for creating virtual devices to control from a Matter Controller, if you are wanting to control your real matter hardware devices from node-red then lookout for my upcoming node-red-matter-controller package instead.

This is not a certified Matter device and is for development and experimentation only, for more information about Matter and to download the standards goto https://handbook.buildwithmatter.com


See the [CHANGELOG](https://github.com/sammachin/node-red-matter-bridge/blob/main/CHANGELOG.md) for details of each release
