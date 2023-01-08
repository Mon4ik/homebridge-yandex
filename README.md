<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

> Plugin is in ALPHA, so it works very bad

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

### Start Homebridge

```
homebridge -D
```

## Authorization

1. Create app in Yandex API at [https://oauth.yandex.ru/client/new](https://oauth.yandex.ru/client/new)
   1. Enter any name
   2. Select platform `Web services` (first)
   3. Select all data with IoT (`iot:view`, `iot:control`)
2. Set redirect URL to: `http://<there's ip>:6767/auth/callback`
3. Then start Homebridge server and go to url and authorize with your YandexID: `http://<there's ip>:6767/auth`

## Support list

### Devices:

- [x] `"devices.types.light"`
- [x] `"devices.types.socket"`
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

### Capabilities:

- [x] `"devices.capabilities.on_off"`:

  - [x] `on`

- [ ] `"devices.capabilities.color_setting"`:

  - [x] `temperature_k`
  - [ ] `hsv`
  - [ ] `rgb`
  - [ ] `scene`

- [ ] `"devices.capabilities.range"`:

  - [x] `brightness`
  - [ ] `channel`
  - [ ] `humidity`
  - [ ] `open`
  - [ ] `temperature`
  - [ ] `volume`

- [ ] `"devices.capabilities.mode"`:

  - [ ] `cleanup_mode`
  - [ ] `coffee_mode`
  - [ ] `dishwashing`
  - [ ] `fan_speed`
  - [ ] `heat`
  - [ ] `input_source`
  - [ ] `program	`
  - [ ] `swing	`
  - [ ] `tea_mode	`
  - [ ] `thermostat	`
  - [ ] `work_speed`

- [ ] `"devices.capabilities.toggle"`:

  - [ ] `backlight`
  - [ ] `controls_locked`
  - [ ] `ionization`
  - [ ] `keep_warm`
  - [ ] `mute`
  - [ ] `oscillation`
  - [ ] `pause`

- [ ] `"devices.capabilities.video_stream"`:

  - [ ] `get_stream`

## Todo

- [x] Better OAuth
- [ ] More devices and capabilities
- [ ] Go to 1.0.0
- [ ] Publish to NPM
