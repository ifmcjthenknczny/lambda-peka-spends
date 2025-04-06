import mongoose from 'mongoose'
import { Day } from '../helpers/util/date'
import { journeyCollection } from './pekaJourneys'

const collectionName = 'MonthlySummaries'

type DbMonthlySummary = {
    _id: string
    from: Day
    to: Day
    sum: number
    createdAt: Date
}

const summaryCollection = (db: mongoose.mongo.Db) => {
    return db.collection<DbMonthlySummary>(collectionName)
}

export const insertMonthlySummary = async (
    db: mongoose.mongo.Db,
    summary: Omit<DbMonthlySummary, 'createdAt'>,
) => {
    try {
        const collection = summaryCollection(db)
        await collection.insertOne({ ...summary, createdAt: new Date() })
    } catch (error: any) {
        throw new Error(
            `Failed to insert PEKA Monthly Summary. ${error.message}`,
        )
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
