import axios from "axios"
import { sync as glob } from "glob"
import { YandexPlatform } from "../platform"

import path from "path"

import { API, PlatformAccessory, Service } from "homebridge"
import {
    BaseProvider,
    Capability,
    CapabilityApply,
    Device,
    YandexRequestOK,
} from "../types"

export class CapabilityManager {
    private readonly yandexPlatform: YandexPlatform
    private readonly api: API
    private readonly accessory: PlatformAccessory
    private readonly device: YandexRequestOK<Device>

    constructor(
        yandexPlatform: YandexPlatform,
        api: API,
        accessory: PlatformAccessory,
        device: YandexRequestOK<Device>
    ) {
        this.yandexPlatform = yandexPlatform
        this.api = api
        this.accessory = accessory
        this.device = device

        this.initAccessory()
    }

    async initAccessory() {
        const service = this.getService()
        const device = await this.yandexPlatform.getDevice(this.device.id)
        if (!device) return

        const caps = glob("./dist/capabilities/*.js", {
            ignore: "./dist/capabilities/index.js",
        }).map((f) => {
            return require(`./${path.basename(f)}`)
        })

        for (const cap of device.capabilities) {
            const Provider = caps.find((c) => c.verify(cap, device))?.default
            if (!Provider) continue

            const provider: BaseProvider = new Provider(
                this.api.hap.Characteristic,
                this.yandexPlatform,
                device
            )

            this.yandexPlatform.log.debug(
                `[${this.device.name}] Setup service ${provider.intent().name}`
            )

            service
                .getCharacteristic(provider.intent())
                .onGet(provider.get.bind(provider))
                .onSet(provider.set.bind(provider))
        }
    }

    getService(): Service {
        switch (this.device.type) {
            case "devices.types.light":
                return (
                    this.accessory.getService(this.api.hap.Service.Lightbulb) ??
                    this.accessory.addService(this.api.hap.Service.Lightbulb)
                )
            case "devices.types.socket":
                return (
                    this.accessory.getService(this.api.hap.Service.Outlet) ??
                    this.accessory.addService(this.api.hap.Service.Outlet)
                )
        }

        throw Error(`Device "${this.device.name}" isn't supporting`)
    }
}
