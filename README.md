
<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

> Plugin is in ALPHA, so it works bad

# Homebridge Yandex

Homebridge plugin for Yandex Home

## Installation

> NPM in future, sorry :(

## Build

### Install dependencies
```
npm install
```

### Build Plugin
```
npm run build
```

### Link To Homebridge
```
npm link
```

You can now start Homebridge, use the `-D` flag so you can see debug log messages in your plugin:

```
homebridge -D
```

## Support list
- [X] `"devices.types.light"`
- [X] `"devices.types.socket"`
- [ ] `"devices.types.switch"`
- [ ] `"devices.types.thermostat"`
- [ ] `"devices.types.thermostat.ac"`
- [ ] `"devices.types.media_device"`
- [ ] `"devices.types.media_device.tv"`
- [ ] `"devices.types.media_device.tv_box"`
- [ ] `"devices.types.media_device.receiver"`
- [ ] `"devices.types.cooking"`
- [ ] `"devices.types.cooking.coffee_maker"`
- [ ] `"devices.types.cooking.kettle"`
- [ ] `"devices.types.cooking.multicooker"`
- [ ] `"devices.types.openable"`
- [ ] `"devices.types.openable.curtain"`
- [ ] `"devices.types.humidifier"`
- [ ] `"devices.types.purifier"`
- [ ] `"devices.types.vacuum_cleaner"`
- [ ] `"devices.types.washing_machine"`
- [ ] `"devices.types.dishwasher"`
- [ ] `"devices.types.iron"`
- [ ] `"devices.types.sensor"`
- [ ] `"devices.types.pet_drinking_fountain"`
- [ ] `"devices.types.pet_feeder"`
- [ ] `"devices.types.other"`

## Todo

- [ ] Better OAuth
- [ ] More devices and capabilities
- [ ] Go to 1.0.0
- [ ] Publish to NPM