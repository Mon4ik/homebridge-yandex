import _ from "lodash"
import axios, {Axios, AxiosRequestConfig, AxiosResponse} from "axios"

const FormData = require("form-data")

import path from "path"
import fs from "fs"
import ip from "ip"

import {
	API,
	APIEvent,
	Categories,
	CharacteristicEventTypes,
	CharacteristicSetCallback,
	CharacteristicValue,
	DynamicPlatformPlugin,
	HAP,
	Logging,
	PlatformAccessory,
	PlatformAccessoryEvent,
	PlatformConfig,
} from "homebridge"

import {PLUGIN_NAME, PLATFORM_NAME} from "./settings"
import {ActionsDevice, Device, YandexRequest, YandexRequestOK} from "./types"
import {AdapterApplier} from "./adapters"
import {build} from "./oauth"
import {YandexAPI} from "./yandexAPI";

function sleep(ms) {
	var start = new Date().getTime(),
		expire = start + ms
	while (new Date().getTime() < expire) {
	}
	return
}

export class YandexPlatform implements DynamicPlatformPlugin {
	readonly log: Logging
	readonly api: API
	readonly config: PlatformConfig
	readonly yandexAPI: YandexAPI
	private readonly oauth_path: string

	readonly accessories: PlatformAccessory[] = []
	private actionsPool: ActionsDevice[] = []

	private actionsPoolVersion: number = 0

	constructor(log: Logging, config: PlatformConfig, api: API) {
		this.log = log
		this.api = api
		this.config = config

		this.oauth_path = path.join(
			this.api.user.storagePath(),
			"yandex_oauth.json"
		)

		this.yandexAPI = new YandexAPI(this.oauth_path, this.log, this.config)

		if (!fs.existsSync(this.oauth_path)) {
			fs.writeFileSync(
				this.oauth_path,
				JSON.stringify({
					access_token: "none",
					refresh_token: "none",
					expires_in: 0,
					created_in: 0,
				}),
				{
					encoding: "utf-8",
				}
			)
		}

		log.info("Platform finished initializing!")

		api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
			build(config.client.id, config.client.secret, this.oauth_path, log)
			this.createYandexAgent()
		})
	}

	/*
	 * This function is invoked when homebridge restores cached accessories from disk at startup.
	 * It should be used to setup event handlers for characteristics and update respective values.
	 */
	async configureAccessory(accessory: PlatformAccessory): Promise<void> {
		this.log("Configuring accessory %s", accessory.displayName)

		const device = await this.yandexAPI.getDevice(accessory.UUID)
		if (device) {
			const cap = new AdapterApplier(this, this.api, accessory, device)
		}

		accessory.on(PlatformAccessoryEvent.IDENTIFY, () => {
			this.log("%s identified!", accessory.displayName)
		})

		this.accessories.push(accessory)
	}

	// --------------------------- CUSTOM METHODS ---------------------------

	/*
	 * Creates yandex agent, which:
	 *  - Creates `yandex_oauth.json`
	 *  - Creates interval for refreshing token
	 *  - Creates interval for fetching accessories
	 */
	async createYandexAgent() {
		this.log.info(this.oauth_path)

		const oauth_content = JSON.parse(
			fs.readFileSync(this.oauth_path).toString("utf-8")
		)

		await this.refreshToken(oauth_content.refresh_token)

		setInterval(() => {
			this.fetchAccessories()
		}, this.config.interval)

		setInterval(async () => {
			const oauth_content = JSON.parse(
				fs.readFileSync(this.oauth_path).toString("utf-8")
			)

			this.log.info("Refreshing token...")

			await this.refreshToken(oauth_content.refresh_token)
		}, 1000 * 60 * 60 * 8)
	}

	/*
	 * Fetch new accessories and create them
	 */

	async fetchAccessories() {
		const oauth_content = JSON.parse(
			fs.readFileSync(this.oauth_path).toString("utf-8")
		)

		const devices_res = await this.yandexAPI.request<{ devices: Device[] }>({
			url: "https://api.iot.yandex.net/v1.0/user/info"
		})

		// Checking that its not null in case if requests failes and no data recieved, so it would be ignored
		if (devices_res !== null && devices_res !== undefined && devices_res.data.status === "ok") {
			for (const device of devices_res.data.devices) {
				const accessory = this.accessories.find(
					(a) => a.UUID === device.id
				)

				if (!accessory) {
					// create new one
					const accessory = new this.api.platformAccessory(
						device.name,
						device.id
					)

					this.configureAccessory(accessory)
					this.api.registerPlatformAccessories(
						PLUGIN_NAME,
						PLATFORM_NAME,
						[accessory]
					)
				}
			}
		}
	}

	async refreshToken(refresh_token: string) {
		const form = new FormData()
		form.append("grant_type", "refresh_token")
		form.append("refresh_token", refresh_token)
		form.append("client_id", this.config.client.id)
		form.append("client_secret", this.config.client.secret)

		this.log.info("Refreshing...")

		const refresh_res = await axios
			.post("https://oauth.yandex.ru/token", form, {
				headers: {
					...form.getHeaders(),
				},
			})
			.catch(
				((error) => {
					this.log.error("Refresh token expired")
					this.log.warn(
						"Go to this link and authorize:"
					)
					this.log.warn(
						` > http://localhost:6767/auth`
					)
					this.log.warn(
						` > http://${ip.address("private")}:6767/auth`
					)
				}).bind(this)
			)

		if (!refresh_res) {
			return
		}

		if (!refresh_res.data.error) {
			fs.writeFileSync(
				this.oauth_path,
				JSON.stringify({
					access_token: refresh_res.data.access_token,
					refresh_token: refresh_res.data.refresh_token,
					expires_in: refresh_res.data.expires_in,
					created_in: new Date().getTime() / 1000,
				})
			)
			this.log.info("Successfully refreshed!")
		}
	}

	// ----------------------------------------------------------------------
}
