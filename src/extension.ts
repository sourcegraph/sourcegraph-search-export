import { Base64 } from 'js-base64'
import * as sourcegraph from 'sourcegraph'

/**
 * A subset of the SearchResult type defined in the Sourcegraph GraphQL API.
 */
interface SearchResult {
    __typename: string
    name: string
    externalURLs: { url: string }[]
    repository: {
        name: string
        externalURLs: { url: string }[]
    }
    file: {
        path: string
        canonicalURL: string
        externalURLs: { url: string }[]
    }
    lineMatches: {
        preview: string
        offsetAndLengths: number[][]
    }[]
}

const searchPatternTypes = ['literal', 'regexp', 'structural'] as const
/** The search pattern type. */
type SearchPatternType = typeof searchPatternTypes[number]

interface Settings {
    ['searchExport.searchPatternType']?: SearchPatternType
    ['searchExport.maxMatchContentLength']?: number
}

export function activate(ctx: sourcegraph.ExtensionContext): void {
    ctx.subscriptions.add(
        sourcegraph.commands.registerCommand(
            'searchExport.exportSearchResultsToCSV',
            async (
                query: string,
                searchBarPatternType: SearchPatternType
            ): Promise<void> => {
                const userFallbackPatternType = sourcegraph.configuration.get<
                    Settings
                >().value['searchExport.searchPatternType']

                // Before Sourcegraph 3.29, search toolbar context didn't include search pattern type, so
                // fallback to "mode" setting, default to 'literal'
                const patternType: SearchPatternType = searchPatternTypes.includes(
                    searchBarPatternType
                )
                    ? searchBarPatternType
                    : userFallbackPatternType &&
                      searchPatternTypes.includes(userFallbackPatternType)
                    ? userFallbackPatternType
                    : 'literal'

                const {
                    data,
                    errors,
                }: {
                    data: { search: { results: { results: SearchResult[] } } }
                    errors?: { message: string }[]
                } = await sourcegraph.commands.executeCommand(
                    'queryGraphQL',
                    `
                query SearchResults($query: String!, $patternType: SearchPatternType) {
                    search(query: $query, patternType: $patternType) {
                        results {
                            results {
                                __typename
                                ... on CommitSearchResult {
                                    messagePreview {
                                        value
                                    }
                                }
                                ... on Repository {
                                    name
                                    externalURLs {
                                        url
                                    }
                                }
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
                                    lineMatches {
                                        preview
                                        offsetAndLengths
                                    }
                                }
                            }
                        }
                    }
                }
                `,
                    {
                        query,
                        patternType,
                    }
                )
                if (errors) {
                    throw new Error(
                        `Search error: ${errors.map(e => e.message).join(',')}`
                    )
                }

                // TODO: This CSV generation is not robust.
                const results = data.search.results.results
                let csvData
                const resultType = '__typename'

                switch (results[0][resultType]) {
                    case 'FileMatch':
                        csvData = [
                            [
                                'Repository',
                                'Repository external URL',
                                'File path',
                                'File URL',
                                'File external URL',
                                'Search matches',
                            ],
                            ...results.map(r => {
                                const searchMatches = r.lineMatches
                                    .map(line =>
                                        line.offsetAndLengths
                                            .map(offset =>
                                                line.preview?.substring(
                                                    offset[0],
                                                    offset[0] + offset[1]
                                                )
                                            )
                                            .join(' ')
                                    )
                                    .join(' ')

                                return [
                                    r.repository.name,
                                    r.repository.externalURLs[0]?.url,
                                    r.file.path,
                                    new URL(
                                        r.file.canonicalURL,
                                        sourcegraph.internal.sourcegraphURL
                                    ).toString(),
                                    r.file.externalURLs[0]?.url,
                                    truncateMatches(searchMatches),
                                ].map(s => JSON.stringify(s))
                            }),
                        ]
                        break
                    case 'Repository':
                        csvData = [
                            ['Repository', 'Repository external URL'],
                            ...results.map(r =>
                                [r.name, r.externalURLs[0]?.url].map(s =>
                                    JSON.stringify(s)
                                )
                            ),
                        ]
                        break
                    case 'CommitSearchResult':
                        throw new Error(
                            `Exporting commit/diff search is currently not supported.`
                        )
                    default:
                        throw new Error(`No result to be exported.`)
                }

                const base64Data = Base64.encodeURI(
                    csvData.map(row => row.join(',')).join('\n')
                )

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

const DEFAULT_MAX_CONTENT_LENGTH = 200
/**
 * Truncate "Search matches" string to avoid hitting the maximum URL length in Chrome:
 * https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/security/url_display_guidelines/url_display_guidelines.md#url-length)
 */
function truncateMatches(searchMatches: string): string {
    // Determine at what length "Search matches" string should be truncated (to avoid hitting the maximum URL length in Chrome:
    // https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/security/url_display_guidelines/url_display_guidelines.md#url-length)
    let maxMatchContentLength = sourcegraph.configuration.get<Settings>().value[
        'searchExport.maxMatchContentLength'
    ]

    if (
        typeof maxMatchContentLength !== 'number' ||
        maxMatchContentLength < 0
    ) {
        maxMatchContentLength = DEFAULT_MAX_CONTENT_LENGTH
    }

    return searchMatches.length > maxMatchContentLength
        ? `${searchMatches.slice(0, maxMatchContentLength)}...`
        : searchMatches
}
