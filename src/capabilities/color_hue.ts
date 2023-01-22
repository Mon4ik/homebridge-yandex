import {kelvin2rgb, rgb2hsv} from "../utils";
import {CharacteristicValue, Characteristic} from "homebridge"
import {BaseProvider, Capability, Device, StateBrightness, StateHSV, StateTemperatureK} from "../types"

export function verify(cap: Capability) {
	return (
		cap.type === "devices.capabilities.color_setting" &&
		cap.parameters.color_model === "hsv"
	)
}

export default class Provider extends BaseProvider {
	intent() {
		return this.characteristic.Hue
	}

	async get() {
		const device = await this.yandexPlatform.getDevice(this.device.id)
		if (!device) return 0

		const cap = device.capabilities.find(verify) as Capability<StateHSV | StateTemperatureK> | undefined
		if (!cap) return 0

		if (cap.state.instance === "temperature_k") {
			const [r, g, b] = kelvin2rgb(cap.state.value)
			const hsv = rgb2hsv(r, g, b)
			return Math.round(hsv.h)
		} else {
			return Math.round(cap.state.value.h)
		}

	}

	async set(value: CharacteristicValue) {
		const cap = this.device.capabilities.find(verify) as Capability<StateHSV | StateTemperatureK> | undefined
		if (!cap) return

		let hsv
		if (cap.state.instance === "hsv") {
			hsv = cap.state.value
		} else {
			const [r, g, b] = kelvin2rgb(cap.state.value)
			const _hsv = rgb2hsv(r, g, b)
			hsv = {h: _hsv.h, s: Math.floor(_hsv.s), v: Math.floor(_hsv.v)}
		}

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
										h: parseInt(value as string),
										s: hsv.s,
										v: hsv.v
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
