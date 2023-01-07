import axios from "axios"
import { Characteristic, CharacteristicValue } from "homebridge"
import { YandexPlatform } from "../platform"
import {
    BaseProvider,
    Capability,
    CapabilityApply,
    Device,
    IProvider,
    YandexRequestOK,
} from "../types"

export function verify(cap: Capability, device: Device) {
    return (
        cap.type === "devices.capabilities.on_off" &&
        cap.state.instance === "on"
    )
}

export default class Provider extends BaseProvider {
    intent() {
        return this.characteristic.On
    }

    async get() {
        const device = await this.yandexPlatform.getDevice(this.device.id)
        if (!device) return 0

        const cap = device.capabilities.find(
            (cap) =>
                cap.type === "devices.capabilities.on_off" &&
                cap.state.instance === "on"
        )
        if (!cap) return 0

        this.yandexPlatform.log.debug(
            `[${this.device.name}] Getting on_off (${cap.state.value})`
        )

        return +cap.state.value
    }

    async set(value: CharacteristicValue) {
        const token = await this.yandexPlatform.getAccessToken()

        this.yandexPlatform.log.debug(
            `[${this.device.name}] Setting on_off (${value})`
        )

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
    }
}
