import { ActionType, lambda } from './lambda-app'

const config = {
    action: ActionType.PING,
    rawEvent: null,
    executionId: 'local',
    runningLocal: true,
}

lambda(config)
