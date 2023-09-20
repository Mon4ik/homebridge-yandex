import axios from "axios"
import {sync as glob} from "glob"
import {YandexPlatform} from "../platform"

import path from "path"

import {API, PlatformAccessory, Service} from "homebridge"
import {
	Adapter,
	Device,
	YandexRequestOK,
} from "../types"
import {getServicesMap} from "../utils";

/** Adapters Applier on device for Apple Home and Yandex Home connection */
export class AdapterApplier {
	constructor(
		private readonly yandexPlatform: YandexPlatform,
		private readonly api: API,
		private readonly accessory: PlatformAccessory,
		private readonly device: YandexRequestOK<Device>
	) {
		this.addAdapters().then(() => this.yandexPlatform.log.debug(`Adapters applied for "${this.device.name}"!`))
	}

	async addAdapters() {
		const service = this.getService()
		const device = await this.yandexPlatform.yandexAPI.getDevice(this.device.id)
		if (!device) return

		console.log(__dirname)
		const caps = glob("./dist/adapters/*.js", {
			ignore: "./dist/adapters/index.js",
		}).map((f) => {
			return require(`./${path.basename(f)}`)
		})

		this.accessory.getService(this.api.hap.Service.AccessoryInformation)!
			.getCharacteristic(this.api.hap.Characteristic.Model)
			.onGet(() => {
				return "Model"
			});


		for (const cap of device.capabilities) {
			const adapterClasses: any[] = caps.filter((c) => c.verify(cap, device)).map((p) => p.default)
			if (adapterClasses.length === 0) continue

			for (const AdapterClass of adapterClasses) {
				const adapter: Adapter = new AdapterClass(
					this.api.hap.Characteristic,
					this.yandexPlatform,
					this.yandexPlatform.yandexAPI,
					device,
					this.accessory
				)

				this.yandexPlatform.log.debug(
					`[${this.device.name}] Setup characteristic ${
						adapter.intent().name
					} for ${service.displayName} service`
				)

				service
					.getCharacteristic(adapter.intent())
					.onGet(async () => {
						const val = await adapter.get.bind(adapter)()

						this.yandexPlatform.log.debug(
							`[${this.device.name}] [G] ${adapter.intent().name} (${val})`
						)

						return val
					})
					.onSet(async (val) => {
						await adapter.set.bind(adapter)(val)

						this.yandexPlatform.log.debug(
							`[${this.device.name}] [S] ${adapter.intent().name} (${val})`
						)
					})
			}
		}
	}

	/** Get Apple's service from Yandex's device type */
	getService(): Service {
		const servicesMap = getServicesMap(this.api.hap)

		if (servicesMap.has(this.device.type)) {
			return (
				this.accessory.getService(
					servicesMap.get(this.device.type)
				) ?? this.accessory.addService(
					servicesMap.get(this.device.type)
				)
			)
		} else {
			this.yandexPlatform.log.warn(`Device "${this.device.name}" isn't supporting (type: ${this.device.type})`)
			return (
				this.accessory.getService(this.api.hap.Service.Switch) ?? this.accessory.addService(this.api.hap.Service.Switch)
			)
		}
	}
}
