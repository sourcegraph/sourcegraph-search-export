const countPrefix = 'count:'
/**
 * Returns whether the query specifies a count. Search queries break when count is specified twice.
 */
export function queryHasCount(query: string): boolean {
    return query
        .split(' ')
        .map(part => part.trim())
        .some(part => {
            if (!part.startsWith(countPrefix)) {
                return false
            }

            return part.slice(countPrefix.length).length > 0
        })
}
