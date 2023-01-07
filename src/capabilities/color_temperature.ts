import axios from "axios"
import { CharacteristicValue, Characteristic } from "homebridge"
import { BaseProvider, Capability, Device } from "../types"

export function verify(cap: Capability, device: Device) {
    return (
        cap.type === "devices.capabilities.color_setting" &&
        cap.state.instance === "temperature_k"
    )
}

export default class Provider extends BaseProvider {
    intent() {
        return this.characteristic.ColorTemperature
    }

    async get() {
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
        const NewRange = 140 - 500

        this.yandexPlatform.log.debug(
            `[${this.device.name}] Getting color_temperature (y:${cap.state.value})`
        )

        return Math.round(
            (((cap.state.value as number) - OldMin) * NewRange) / OldRange + 500
        )
    }

    async set(value: CharacteristicValue) {
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

        this.yandexPlatform.log.debug(
            `[${this.device.name}] Setting color_temperature (hb:${value}, y:${NewValue})`
        )

        await axios({
            url: "https://api.iot.yandex.net/v1.0/devices/actions",
            method: "POST",
            data: {
                devices: [
                    {
                        id: this.device.id,
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
