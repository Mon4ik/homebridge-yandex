import axios from "axios";
import {CharacteristicValue} from "homebridge"
import {Adapter, Capability, StateHSV, StateTemperatureK} from "../types"
import {color2kelvin, HSVtoRGB} from "../utils";
import chroma, {Color} from "chroma-js";

export function verify(cap: Capability) {
	return (
		cap.type === "devices.capabilities.color_setting" &&
		cap.parameters.color_model === "hsv"
	)
}

export default class Provider extends Adapter {
	intent() {
		return this.characteristic.Saturation
	}

	async get() {
		const device = await this.getLatestDevice()
		if (!device) return 0

		const cap = device.capabilities.find(verify) as Capability<StateHSV | StateTemperatureK> | undefined
		if (!cap) return 0

		if (cap.state.instance === "temperature_k") {
			const [h, s, v] = chroma.temperature(cap.state.value).hsv()
			return Math.round(s * 100)
		} else {
			return Math.round(cap.state.value.s)
		}
	}

	async set(value: CharacteristicValue) {
		const device = await this.getLatestDevice()
		if (!device) return

		const cap = device.capabilities.find(verify) as Capability<StateHSV | StateTemperatureK> | undefined
		if (!cap) return

		let hue = this.accessory
			.getService(this.yandexPlatform.api.hap.Service.Lightbulb)
			?.getCharacteristic(this.characteristic.Hue).value as number

		const color = chroma(HSVtoRGB(hue / 100, parseInt(value.toString()) / 100, 1))
		const kelvin = color2kelvin(color, cap.parameters.temperature_k.min, cap.parameters.temperature_k.max)

		console.log(color, kelvin)

		if (kelvin > -1) {
			this.yandexAPI.addAction({
				id: this.device.id,
				actions: [
					{
						type: "devices.capabilities.color_setting",
						state: {
							instance: "temperature_k",
							value: kelvin,
						},
					},
				],
			})
		} else {
			this.yandexAPI.addAction({
				id: this.device.id,
				actions: [
					{
						type: "devices.capabilities.color_setting",
						state: {
							instance: "hsv",
							value: {
								h: Math.round(color.hsv()[0]),
								s: Math.round(color.hsv()[1] * 100),
								v: Math.floor(color.hsv()[2] * 100),
							},
						},
					},
				],
			})
		}
	}
}
