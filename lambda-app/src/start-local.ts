import { ActionType, lambda } from './lambda-app'

const config = {
    action: ActionType.SUMMARY_MONTHLY_MIGRATION,
    rawEvent: null,
    executionId: 'local',
    runningLocal: true,
}

lambda(config)
