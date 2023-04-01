import axios from "axios"
import { CharacteristicValue, Characteristic } from "homebridge"
import {BaseProvider, Capability, Device, StateBrightness} from "../types"

export function verify(cap: Capability, device: Device) {
    return (
        cap.type === "devices.capabilities.range" &&
        cap.state.instance === "brightness"
    )
}

export default class Provider extends BaseProvider {
    intent() {
        return this.characteristic.Brightness
    }

    async get() {
        const device = await this.yandexPlatform.getDevice(this.device.id)
        if (!device) return 100

        const cap = device.capabilities.find(
            (cap) =>
                cap.type === "devices.capabilities.range" &&
                cap.state.instance === "brightness"
        )
        if (!cap) return 100

        return Math.round((cap.state as StateBrightness).value)
    }

    async set(value: CharacteristicValue) {
        const token = this.yandexPlatform.getAccessToken()

        const cap = this.device.capabilities.find(
            (cap) =>
                cap.type === "devices.capabilities.range" &&
                cap.state.instance === "brightness"
        )
        if (!cap) return

        const new_value = Math.round(parseInt(value.toString()))


        this.yandexPlatform.addAction({
            id: this.device.id,
            actions: [
                {
                    type: "devices.capabilities.range",
                    state: {
                        instance: "brightness",
                        value: new_value,
                    },
                },
            ],
        })
    }
}
