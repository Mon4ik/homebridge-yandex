import {
	CharacteristicGetHandler,
	CharacteristicSetHandler,
	CharacteristicValue, PlatformAccessory,
	WithUUID,
} from "homebridge"

import {Characteristic} from "hap-nodejs";


import {YandexPlatform} from "./platform"

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

export class BaseProvider implements IProvider {
	// readonly intent: Characteristic
	// readonly yandexPlatform: YandexPlatform
	// readonly device: Device

	constructor(
		readonly characteristic: typeof Characteristic,
		readonly yandexPlatform: YandexPlatform,
		readonly device: Device,
		readonly accessory: PlatformAccessory
	) {}

	intent(): WithUUID<new () => Characteristic> {
		return this.characteristic.On
	}

	async get() {
		return 0
	}

	async set(value) {
	}
}

export interface IProvider {
	readonly characteristic: any
	readonly yandexPlatform: YandexPlatform
	readonly device: Device

	// constructor(
	//     intent: Characteristic,
	//     yandexPlatform: YandexPlatform,
	//     device: Device
	// ): void

	intent(): new () => Characteristic

	get: CharacteristicGetHandler
	set: CharacteristicSetHandler
}
