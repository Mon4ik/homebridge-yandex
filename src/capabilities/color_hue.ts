import {color2kelvin, HSVtoRGB} from "../utils";
import chroma, {Color} from "chroma-js";
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
			const [h, s, v] = chroma.temperature(cap.state.value).hsv()
			return Math.round(h)
		} else {
			return Math.round(cap.state.value.h)
		}

	}

	async set(value: CharacteristicValue) {
		const device = await this.yandexPlatform.getDevice(this.device.id)
		if (!device) return

		const cap = device.capabilities.find(verify) as Capability<StateHSV | StateTemperatureK> | undefined
		if (!cap) return

		const saturation = this.accessory
			.getService(this.yandexPlatform.api.hap.Service.Lightbulb)
			?.getCharacteristic(this.characteristic.Saturation).value as number

		const color = chroma(HSVtoRGB(parseInt(value.toString()) / 360, saturation / 100, 1))

		const kelvin = color2kelvin(color, cap.parameters.temperature_k.min, cap.parameters.temperature_k.max)

		console.log(color, kelvin)

		if (kelvin > -1) {
			this.yandexPlatform.addAction({
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
			this.yandexPlatform.addAction({
				id: this.device.id,
				actions: [
					{
						type: "devices.capabilities.color_setting",
						state: {
							instance: "hsv",
							value: {
								h: Math.floor(color.hsv()[0]),
								s: Math.floor(color.hsv()[1] * 100),
								v: Math.floor(color.hsv()[2] * 100),
							},
						},
					},
				],
			})
		}


	}
}
