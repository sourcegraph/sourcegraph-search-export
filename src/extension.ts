import * as sourcegraph from 'sourcegraph'
import { Base64 } from 'js-base64'

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

export function activate(ctx: sourcegraph.ExtensionContext): void {
    ctx.subscriptions.add(
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
                const csvData = [
                    [
                        'Repository',
                        'Repository external URL',
                        'File path',
                        'File URL',
                        'File external URL',
                    ],
                    ...results.map(r =>
                        [
                            r.repository.name,
                            r.repository.externalURLs[0]?.url,
                            r.file.path,
                            new URL(
                                r.file.canonicalURL,
                                sourcegraph.internal.sourcegraphURL
                            ).toString(),
                            r.file.externalURLs[0]?.url,
                        ].map(s => JSON.stringify(s))
                    ),
                ]
                    .map(row => row.join(','))
                    .join('\n')
                const base64Data = Base64.encodeURI(csvData)

                const downloadFilename = `sourcegraph-search-export-${query.replace(
                    /[^\w]/g,
                    '-'
                )}.csv`

                // Show the user a download link for the CSV.
                sourcegraph.app.activeWindow?.showNotification(
                    `Search results export is complete.\n\n<a href="data:text/csv;base64,${base64Data}" download="${downloadFilename}"><strong>Download CSV</strong></a>`,
                    sourcegraph.NotificationType.Success
                )
            }
        )
    )
}
