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
