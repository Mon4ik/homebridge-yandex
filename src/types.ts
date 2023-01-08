import {
    Characteristic,
    CharacteristicGetHandler,
    CharacteristicSetHandler,
    CharacteristicValue,
    WithUUID,
} from "homebridge"
import { YandexPlatform } from "./platform"

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

export type Capability = {
    reportable: boolean
    retrievable: boolean
    type: string
    parameters: Record<string, any>
    state: {
        instance: string
        value: boolean | number
    }
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
    capabilities: Capability[]
    properties: []
}

export type CapabilityApply = {
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
        readonly characteristic: any,
        readonly yandexPlatform: YandexPlatform,
        readonly device: Device
    ) {}

    intent(): WithUUID<new () => Characteristic> {
        return this.characteristic.On
    }

    async get() {
        return 0
    }

    async set(value) {}
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
