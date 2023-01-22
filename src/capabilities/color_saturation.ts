import axios from "axios";
import {CharacteristicValue, Characteristic} from "homebridge"
import {BaseProvider, Capability, Device, StateBrightness, StateHSV} from "../types"

export function verify(cap: Capability) {
	return (
		cap.type === "devices.capabilities.color_setting" &&
		cap.parameters.color_model === "hsv"
	)
}

export default class Provider extends BaseProvider {
	intent() {
		return this.characteristic.Saturation
	}

	async get() {
		const device = await this.yandexPlatform.getDevice(this.device.id)
		if (!device) return 0

		const cap = device.capabilities.find(verify) as Capability<StateHSV> | undefined
		if (!cap) return 0

		return Math.round(cap.state.value.s)
	}

	async set(value: CharacteristicValue) {
		const cap = this.device.capabilities.find(verify) as Capability<StateHSV> | undefined
		if (!cap) return

		await this.yandexPlatform.requestYandexAPI({
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
									instance: "hsv",
									value: {
										h: cap.state.value.h,
										s: parseInt(value as string),
										v: cap.state.value.v
									},
								},
							},
						],
					},
				],
			}
		})
	}
}
