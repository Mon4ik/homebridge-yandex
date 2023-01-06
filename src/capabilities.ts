import axios from "axios"
import {
    API,
    Characteristic,
    CharacteristicValue,
    PlatformAccessory,
    Service,
} from "homebridge"
import { YandexPlatform } from "./platform"
import { Capability, CapabilityApply, Device, YandexRequestOK } from "./types"

export class CapabilityManager {
    private readonly yandexPlatform: YandexPlatform
    private readonly api: API
    private readonly accessory: PlatformAccessory
    private readonly device: YandexRequestOK<Device>

    constructor(
        yandexPlatform: YandexPlatform,
        api: API,
        accessory: PlatformAccessory,
        device: YandexRequestOK<Device>
    ) {
        this.yandexPlatform = yandexPlatform
        this.api = api
        this.accessory = accessory
        this.device = device

        this.initAccessory()
    }

    async initAccessory() {
        const device = await this.yandexPlatform.getDevice(this.device.id)
        if (!device) return

        device.capabilities.forEach((cap) => {
            switch (cap.type) {
                case "devices.capabilities.on_off":
                    this.provideOnOff(device, cap)
                case "devices.capabilities.color_setting":
                    this.provideColorSetting(device, cap)
            }
        })
    }

    getService(): Service {
        let service: Service | undefined

        switch (this.device.type) {
            case "devices.types.light":
                service =
                    this.accessory.getService(this.api.hap.Service.Lightbulb) ??
                    this.accessory.addService(this.api.hap.Service.Lightbulb)
            case "devices.types.socket":
                service =
                    this.accessory.getService(this.api.hap.Service.Lightbulb) ??
                    this.accessory.addService(this.api.hap.Service.Lightbulb)
        }

        if (!service) {
            throw Error(
                `Accessory "${this.accessory.displayName}" hasn't service`
            )
        }

        return service
    }

    private async provideOnOff(device: Device, capability: Capability) {
        const service = this.getService()

        switch (capability.state.instance) {
            case "on":
                service
                    .getCharacteristic(this.api.hap.Characteristic.On)
                    .onGet(this.getOnOff.bind(this))
                    .onSet(this.setOnOff.bind(this))
        }
    }

    private async provideColorSetting(device: Device, capability: Capability) {
        const service = this.getService()

        switch (capability.state.instance) {
            case "temperature_k":
                service
                    .getCharacteristic(
                        this.api.hap.Characteristic.ColorTemperature
                    )
                    .onGet(this.getColorTemperature.bind(this))
                    .onSet(this.setColorTemperature.bind(this))
        }
    }

    private async getOnOff() {
        const device = await this.yandexPlatform.getDevice(this.device.id)
        if (!device) return 0

        const cap = device.capabilities.find(
            (cap) =>
                cap.type === "devices.capabilities.on_off" &&
                cap.state.instance === "on"
        )
        if (!cap) return 0

        return +cap.state.value
    }

    private async setOnOff(value: CharacteristicValue) {
        const token = await this.yandexPlatform.getAccessToken()

        const setting_res = await axios<YandexRequestOK<CapabilityApply>>({
            url: "https://api.iot.yandex.net/v1.0/devices/actions",
            method: "POST",
            data: {
                devices: [
                    {
                        id: this.device.id,
                        actions: [
                            {
                                type: "devices.capabilities.on_off",
                                state: {
                                    instance: "on",
                                    value: value.toString() === "true",
                                },
                            },
                        ],
                    },
                ],
            },
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        console.log(
            value.toString(),
            setting_res.data.devices[0].capabilities[0].state
        )
    }

    private async getColorTemperature() {
        const device = await this.yandexPlatform.getDevice(this.device.id)
        if (!device) return 140

        const cap = device.capabilities.find(
            (cap) =>
                cap.type === "devices.capabilities.color_setting" &&
                cap.state.instance === "temperature_k"
        )
        if (!cap) return 140

        const OldMin = cap.parameters.temperature_k.min
        const OldMax = cap.parameters.temperature_k.max

        const OldRange = OldMax - OldMin
        const NewRange = 500 - 140

        return Math.round(
            (((cap.state.value as number) - OldMin) * NewRange) / OldRange + 140
        )
    }

    private async setColorTemperature(value: CharacteristicValue) {
        const token = this.yandexPlatform.getAccessToken()

        const cap = this.device.capabilities.find(
            (cap) =>
                cap.type === "devices.capabilities.color_setting" &&
                cap.state.instance === "temperature_k"
        )
        if (!cap) return

        const NewMin = cap.parameters.temperature_k.min
        const NewMax = cap.parameters.temperature_k.max

        const OldRange = 140 - 500
        const NewRange = NewMax - NewMin
        const NewValue = Math.round(
            ((parseInt(value.toString()) - 500) * NewRange) / OldRange + NewMin
        )

        await axios({
            url: "https://api.iot.yandex.net/v1.0/devices/actions",
            method: "POST",
            data: {
                devices: [
                    {
                        id: this.accessory.UUID,
                        actions: [
                            {
                                type: "devices.capabilities.color_setting",
                                state: {
                                    instance: "temperature_k",
                                    value: NewValue,
                                },
                            },
                        ],
                    },
                ],
            },
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }).catch((e) => {
            this.yandexPlatform.log(e.response)
        })
    }
}
