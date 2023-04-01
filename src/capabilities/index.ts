import axios from "axios"
import { sync as glob } from "glob"
import { YandexPlatform } from "../platform"

import path from "path"

import { API, PlatformAccessory, Service } from "homebridge"
import {
    BaseProvider,
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

        this.accessory.getService(this.api.hap.Service.AccessoryInformation)!
            .getCharacteristic(this.api.hap.Characteristic.Model)
            .onGet(() => {
                return "OKURRR"
            });



        for (const cap of device.capabilities) {
            const providers: (typeof BaseProvider)[] = caps.filter((c) => c.verify(cap, device)).map((p) => p.default)
            if (providers.length === 0) continue

            for (const Provider of providers) {
                const provider: BaseProvider = new Provider(
                    this.api.hap.Characteristic,
                    this.yandexPlatform,
                    device,
                    this.accessory
                )

                this.yandexPlatform.log.debug(
                    `[${this.device.name}] Setup characteristic ${
                        provider.intent().name
                    } for ${service.displayName} service`
                )

                service
                    .getCharacteristic(provider.intent())
                    .onGet(async () => {
                        const val = await provider.get.bind(provider)()

                        this.yandexPlatform.log.debug(
                            `[${this.device.name}] [G] ${provider.intent().name} (${val})`
                        )

                        return val
                    })
                    .onSet(async (val) => {
                        await provider.set.bind(provider)(val)

                        this.yandexPlatform.log.debug(
                            `[${this.device.name}] [S] ${provider.intent().name} (${val})`
                        )
                    })
            }
        }
    }

    getService(): Service {
        let service: Service | undefined

        switch (this.device.type) {
            case "devices.types.light":
                service = this.accessory.getService(
                    this.api.hap.Service.Lightbulb
                )

                if (!service) {
                    service = this.accessory.addService(
                        this.api.hap.Service.Lightbulb
                    )
                }
                break

            case "devices.types.socket":
                service = this.accessory.getService(this.api.hap.Service.Outlet)

                if (!service) {
                    service = this.accessory.addService(
                        this.api.hap.Service.Outlet
                    )
                }
                break
            default:
                throw Error(`Device "${this.device.name}" isn't supporting`)
                break
        }

        return service
    }
}
