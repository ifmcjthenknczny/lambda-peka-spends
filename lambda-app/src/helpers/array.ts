export function chunkify<T>(array: T[], chunkSize: number): T[][] {
    const result = []
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize))
    }
    return result
}

export function sum (numbers: number[]): number {
    return numbers.reduce((acc, curr) => acc + curr, 0);
}
