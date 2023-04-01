import axios from "axios"
import { Characteristic, CharacteristicValue } from "homebridge"
import { YandexPlatform } from "../platform"
import {
    BaseProvider,
    Capability,
    Device
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

        return +cap.state.value
    }

    async set(value: CharacteristicValue) {
        this.yandexPlatform.addAction({
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
        })
    }
}
