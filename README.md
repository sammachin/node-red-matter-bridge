# Node-RED Matter Bridge
WORK IN PROGRESS    

v0.0.10 September 2024 has updated the matter.js library to a new version and uses a new API, therefore this should be considered a breaking change and you will likely need to re-commision your devices into your Matter fabric.
Flows _should_ not be broken but I can't commit to that.

The goal is to implement a Matter device bridge in Node-RED so that Nodes may appear to the Matter fabric as devices.

Currently only basic on/off Lights, Dimmable Lights and On/Off Sockets are implemented.

This is using the matter.js library which is still under development itself.

