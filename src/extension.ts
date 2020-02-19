import * as sourcegraph from 'sourcegraph'

/**
 * A subset of the SearchResult type defined in the Sourcegraph GraphQL API.
 */
interface SearchResult {
    __typename: string
    repository: {
        name: string
        externalURLs: { url: string }[]
    }
    file: {
        path: string
        canonicalURL: string
        externalURLs: { url: string }[]
    }
}

/** Entrypoint for the extension. */
export function activate(context: sourcegraph.ExtensionContext): void {
    sourcegraph.commands.registerCommand(
        'searchExport.exportSearchResultsToCSV',
        async (query: string): Promise<void> => {
            const {
                data,
                errors,
            }: {
                data: { search: { results: { results: SearchResult[] } } }
                errors?: { message: string }[]
            } = await sourcegraph.commands.executeCommand(
                'queryGraphQL',
                `
                query SearchResults($query: String!) {
                    search(query: $query) {
                        results {
                            results {
                                __typename
                                ... on FileMatch {
                                    repository {
                                        name
                                        externalURLs {
                                            url
                                        }
                                    }
                                    file {
                                        path
                                        canonicalURL
                                        externalURLs {
                                            url
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                `,
                {
                    // Add a large count: to ensure we get all results.
                    query: `${query} count:99999999`,
                }
            )
            if (errors) {
                throw new Error(
                    `Search error: ${errors.map(e => e.message).join(',')}`
                )
            }

            // TODO: This CSV generation is not robust.
            const results = data.search.results.results
            const csvData = results
                .map(r =>
                    [
                        r.repository.name,
                        r.repository.externalURLs[0]?.url,
                        r.file.path,
                        r.file.canonicalURL,
                        r.file.externalURLs[0]?.url,
                    ].join(',')
                )
                .join('\n')

            // Display the CSV in the browser devtools console.
            console.log(csvData)
        }
    )
}
