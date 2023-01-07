import http, { IncomingMessage, Server, ServerResponse } from "http"
import axios from "axios"

const FormData = require("form-data")

import path from "path"
import fs from "fs"

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

import { PLUGIN_NAME, PLATFORM_NAME } from "./settings"
import { Device, YandexRequest, YandexRequestOK } from "./types"
import { CapabilityManager } from "./capabilities/index"

function sleep(ms) {
    var start = new Date().getTime(),
        expire = start + ms
    while (new Date().getTime() < expire) {}
    return
}

export class YandexPlatform implements DynamicPlatformPlugin {
    readonly log: Logging
    private readonly api: API
    private readonly config: PlatformConfig
    private readonly oauth_path: string

    private readonly accessories: PlatformAccessory[] = []

    constructor(log: Logging, config: PlatformConfig, api: API) {
        this.log = log
        this.api = api
        this.config = config

        this.oauth_path = path.join(
            this.api.user.storagePath(),
            "yandex_oauth.json"
        )

        log.info("Example platform finished initializing!")

        /*
         * When this event is fired, homebridge restored all cached accessories from disk and did call their respective
         * `configureAccessory` method for all of them. Dynamic Platform plugins should only register new accessories
         * after this event was fired, in order to ensure they weren't added to homebridge already.
         * This event can also be used to start discovery of new accessories.
         */
        api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
            this.createYandexAgent()
        })
    }

    /*
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    async configureAccessory(accessory: PlatformAccessory): Promise<void> {
        const oauth_content = JSON.parse(
            fs.readFileSync(this.oauth_path).toString("utf-8")
        )

        this.log("Configuring accessory %s", accessory.displayName)

        const device = await this.getDevice(accessory.UUID)

        if (device) {
            new CapabilityManager(this, this.api, accessory, device)
        }

        accessory.on(PlatformAccessoryEvent.IDENTIFY, () => {
            this.log("%s identified!", accessory.displayName)
        })

        this.accessories.push(accessory)
    }

    // --------------------------- CUSTOM METHODS ---------------------------

    async getDevice(id: string): Promise<YandexRequestOK<Device> | undefined> {
        const oauth_content = JSON.parse(
            fs.readFileSync(this.oauth_path).toString("utf-8")
        )

        const device_info_res = await axios<YandexRequest<Device>>({
            url: `https://api.iot.yandex.net/v1.0/devices/${id}`,
            headers: {
                Authorization: `Bearer ${oauth_content.access_token}`,
            },
        })

        if (device_info_res.data.status === "ok") {
            return device_info_res.data
        }
    }

    addAccessory(name: string) {
        this.log.info("Adding new accessory with name %s", name)

        // uuid must be generated from a unique but not changing data source, name should not be used in the most cases. But works in this specific example.
        const uuid = this.api.hap.uuid.generate(name)
        const accessory = new this.api.platformAccessory(name, uuid)

        accessory.addService(this.api.hap.Service.Lightbulb, "Test Light")

        this.configureAccessory(accessory) // abusing the configureAccessory here

        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
            accessory,
        ])
    }

    removeAccessories() {
        // we don't have any special identifiers, we just remove all our accessories

        this.log.info("Removing all accessories")

        this.api.unregisterPlatformAccessories(
            PLUGIN_NAME,
            PLATFORM_NAME,
            this.accessories
        )
        this.accessories.splice(0, this.accessories.length) // clear out the array
    }

    getAccessToken(): string {
        const oauth_content = JSON.parse(
            fs.readFileSync(this.oauth_path).toString("utf-8")
        )

        return oauth_content.access_token
    }

    async createYandexAgent() {
        this.log.info(this.oauth_path)

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

        const oauth_content = JSON.parse(
            fs.readFileSync(this.oauth_path).toString("utf-8")
        )

        await this.refreshToken(oauth_content.refresh_token)

        setInterval(() => {
            this.fetchAccessoriesStatuses()
        }, this.config.interval)

        setInterval(async () => {
            const oauth_content = JSON.parse(
                fs.readFileSync(this.oauth_path).toString("utf-8")
            )

            this.log.info("Refreshing...")

            await this.refreshToken(oauth_content.refresh_token)
        }, 1000 * 60 * 60 * 8)
    }

    async fetchAccessoriesStatuses() {
        const oauth_content = JSON.parse(
            fs.readFileSync(this.oauth_path).toString("utf-8")
        )

        const devices_res = await axios({
            url: "https://api.iot.yandex.net/v1.0/user/info",
            headers: {
                Authorization: `Bearer ${oauth_content.access_token}`,
            },
        })

        if (devices_res.data.status === "ok") {
            const devices: Device[] = devices_res.data.devices

            for (const device of devices) {
                const accessory = this.accessories.find(
                    (a) => a.UUID === device.id
                )

                if (!accessory) {
                    // create new one
                    const accessory = new this.api.platformAccessory(
                        device.name,
                        device.id
                    )

                    switch (device.type) {
                        case "devices.types.light":
                            accessory.addService(
                                this.api.hap.Service.Lightbulb,
                                device.name
                            )
                            break

                        case "devices.types.socket":
                            accessory.addService(
                                this.api.hap.Service.Outlet,
                                device.name
                            )
                            break

                        default:
                            break
                    }

                    this.configureAccessory(accessory)

                    this.api.registerPlatformAccessories(
                        PLUGIN_NAME,
                        PLATFORM_NAME,
                        [accessory]
                    )
                }

                device.capabilities[0].last_updated
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
                    this.log.warn("Refresh token expired")
                    this.log.warn(
                        "Go to this link and fetch access, refresh token and etc.:"
                    )
                    this.log.warn(
                        `https://oauth.yandex.ru/authorize?response_type=code&client_id=${this.config.client.id}`
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
