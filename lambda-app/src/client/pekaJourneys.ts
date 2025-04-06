import mongoose from 'mongoose'
import { TransitContent } from '../request'
import { Day, toDay } from '../helpers/util/date'

const collectionName = 'PekaJourneys'

export type DbPekaJourney = {
    _id: string
    transactionDate: Day
    price: number
    createdAt: Date
}

export const toDbPekaJourney = (journey: TransitContent): DbPekaJourney => {
    return {
        _id: journey.transactionId,
        transactionDate: toDay(journey.transactionDate),
        price: journey.price,
        createdAt: new Date(),
    }
}

const pekaCollection = (db: mongoose.mongo.Db) => {
    return db.collection<DbPekaJourney>(collectionName)
}

export const insertPekaJourneys = async (
    db: mongoose.mongo.Db,
    journeys: DbPekaJourney[],
) => {
    try {
        const collection = pekaCollection(db)
        await collection.insertMany(journeys)
    } catch (error: any) {
        throw new Error(`Failed to insert PEKA Journeys. ${error.message}`)
    }
}
