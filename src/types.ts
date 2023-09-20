import {
	CharacteristicGetHandler,
	CharacteristicSetHandler,
	CharacteristicValue, PlatformAccessory,
	WithUUID,
} from "homebridge"

import {Characteristic} from "hap-nodejs";


import {YandexPlatform} from "./platform"
import {YandexAPI} from "./yandexAPI";

export type YandexRequestOK<T> = {
	status: "ok"
	request_id: string
} & T

export type YandexRequestBAD = {
	status: "error"
	request_id: string
	message: string
}

export type YandexRequest<T> = YandexRequestOK<T> | YandexRequestBAD

export type StateHSV = {
	instance: "hsv",
	value: {
		h: number
		s: number
		v: number
	}
}

export type StateBrightness = {
	instance: "brightness",
	value: number
}

export type StateOn = {
	instance: "on",
	value: boolean
}

export type StateTemperatureK = {
	instance: "temperature_k",
	value: number
}

export type State = StateHSV | StateBrightness | StateOn | StateTemperatureK

export type Capability<S = State> = {
	reportable: boolean
	retrievable: boolean
	type: string
	parameters: Record<string, any>
	state: S
	last_updated: number
}

export type Device = {
	id: string
	name: string
	aliases: string[]
	type: string
	external_id: string
	skill_id: string
	household_id: string
	room: string
	groups: string[]
	capabilities: Capability<State>[]
	properties: []
}

export type ActionsDevice = {
	id: string,
	actions: { "type": string, state: any }[]
}

export type ActionsDeviceResult = {
	devices: {
		id: string
		capabilities: {
			type: string
			state: {
				instance: string
				action_result: {
					status: string
				}
			}
		}[]
	}[]
}

export abstract class Adapter {
	// readonly intent: Characteristic
	// readonly yandexPlatform: YandexPlatform
	// readonly device: Device

	constructor(
		readonly characteristic: typeof Characteristic,
		readonly yandexPlatform: YandexPlatform,
		readonly yandexAPI: YandexAPI,
		readonly device: Device,
		readonly accessory: PlatformAccessory
	) {
	}

	getLatestDevice() {
		return this.yandexAPI.getDevice(this.device.id)
	}

	/** Apple's Home Characteristic (Brightness, Color, etc.) */
	abstract intent(): WithUUID<new () => Characteristic>

	/** Get value for characteristic for Apple's Home from Yandex Home */
	abstract get(): Promise<number>

	/** Set new value for characteristic for Yandex Home (set from Apple's Home) */
	abstract set(value: CharacteristicValue): Promise<void>
}

// export interface IProvider {
// 	readonly characteristic: any
// 	readonly yandexPlatform: YandexPlatform
// 	readonly device: Device
//
// 	// constructor(
// 	//     intent: Characteristic,
// 	//     yandexPlatform: YandexPlatform,
// 	//     device: Device
// 	// ): void
//
// 	intent(): new () => Characteristic
//
// 	get: CharacteristicGetHandler
// 	set: CharacteristicSetHandler
// }
