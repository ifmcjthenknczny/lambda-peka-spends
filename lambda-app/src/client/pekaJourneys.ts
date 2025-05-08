import mongoose from 'mongoose'
import { Day, toDay } from '../helpers/date'
import { TransitContent } from '../requests/transits'

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

export const journeyCollection = (db: mongoose.mongo.Db) => {
    return db.collection<DbPekaJourney>(collectionName)
}

export const insertPekaJourneys = async (
    db: mongoose.mongo.Db,
    journeys: DbPekaJourney[],
) => {
    try {
        const collection = journeyCollection(db)
        await collection.insertMany(journeys)
    } catch (error: any) {
        throw new Error(`Failed to insert PEKA Journeys. ${error.message}`)
    }
}

export const sumPrices = async (
    db: mongoose.mongo.Db,
    start: Day,
    end: Day,
) => {
    const collection = journeyCollection(db)
    const result = await collection
        .aggregate<{ totalSpent: number }>([
            {
                $match: {
                    transactionDate: {
                        $gte: start,
                        $lte: end,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalPrice: { $sum: '$price' },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalSpent: { $round: ['$totalPrice', 2] },
                },
            },
        ])
        .toArray()

    return result?.[0]?.totalSpent || 0
}
