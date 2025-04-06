import axios from 'axios'
import { REQUEST_HEADERS } from '../request'

type AuthenticationResponse = {
    code: number
    data: string // bearer token
}

export const authenticate = async () => {
    const response = await axios.post<AuthenticationResponse>(
        'https://www.peka.poznan.pl/sop/authenticate?lang=pl',
        {
            password: process.env.PASSWORD,
            username: process.env.EMAIL,
        },
        { headers: { ...REQUEST_HEADERS, Priority: 'u=0' } },
    )
    return response.data
}
