import fs from "fs";
import axios, {AxiosRequestConfig, AxiosResponse} from "axios/index";
import {ActionsDevice, Device, YandexRequest, YandexRequestOK} from "./types";
import _ from "lodash";
import {Logging, PlatformConfig} from "homebridge";

export class YandexAPI {
	private actionsPool: Array<any> = []
	private actionsPoolVersion = 0

	constructor(
		private oauth_path: string,
		private log: Logging,
		private config: PlatformConfig
	) {
	}

	getAccessToken(): string {
		const oauth_content = JSON.parse(
			fs.readFileSync(this.oauth_path).toString("utf-8")
		)

		return oauth_content.access_token
	}

	request<T>(request: AxiosRequestConfig): Promise<AxiosResponse<YandexRequest<T>>> {
		const access_token = this.getAccessToken()

		return axios({
			headers: {
				"Authorization": `Bearer ${access_token}`
			},
			validateStatus: () => true,
			...request
		})
	}

	addAction(action: ActionsDevice) {
		const action_device = this.actionsPool.find((a) => a.id === action.id)

		if (!action_device) {
			this.actionsPool.push(action)
		} else {
			action_device.actions.push(...action.actions.filter(
				(a) =>
					!action_device.actions.some((ac) => ac.type === a.type)
			))
		}

		this.actionsPoolVersion++
		const actionPoolVer = _.clone(this.actionsPoolVersion)

		setTimeout(() => {
			console.log(actionPoolVer, this.actionsPoolVersion)

			if (this.actionsPool.length === 0) return;
			if (this.actionsPoolVersion > actionPoolVer) return;

			const old_actionsPool = _.clone(this.actionsPool)
			this.actionsPool = []

			this.request({
				url: "https://api.iot.yandex.net/v1.0/devices/actions",
				method: "POST",
				data: {
					devices: old_actionsPool,
				}
			}).then((r) => {
				if (r.data.status === "error") {
					this.log.error(`Error while applying actions: ${r.data.message}`)
				} else {
					this.log.debug(`Actions applied (${old_actionsPool.map((a) => a.actions).flat().length}), pool cleared!`)
				}

				this.actionsPoolVersion = 0
			})
		}, this.config.action_timeout)
	}

	async getDevice(id: string): Promise<YandexRequestOK<Device> | undefined> {
		const device_info_res = await this.request<Device>({
			url: `https://api.iot.yandex.net/v1.0/devices/${id}`
		})

		if (device_info_res.data.status === "ok") {
			return device_info_res.data
		}
	}
}