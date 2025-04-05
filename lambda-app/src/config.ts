import dotenv from 'dotenv'
import { fromIni } from '@aws-sdk/credential-providers'

dotenv.config()

export const AWS_PROFILE = process.env.AWS_PROFILE
export const AWS_REGION = 'eu-central-1'
export const SECRETS_NAME = ''

export const AWS_CREDENTIALS_CONFIG = {
    region: AWS_REGION,
    credentials: AWS_PROFILE ? fromIni({ profile: AWS_PROFILE }) : undefined,
}
