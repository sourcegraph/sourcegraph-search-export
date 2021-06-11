# Sourcegraph search results CSV export extension

[![master build status](https://img.shields.io/github/workflow/status/sourcegraph/sourcegraph-search-export/build/master?logo=github)](https://github.com/sourcegraph/sourcegraph-search-export/actions?query=branch%3Amaster)
[![codecov](https://codecov.io/gh/sourcegraph/sourcegraph-search-export/branch/master/graph/badge.svg)](https://codecov.io/gh/sourcegraph/sourcegraph-search-export)

A [Sourcegraph extension](https://docs.sourcegraph.com/extensions) to export a list of search results to CSV.

[**🗃️ Source code**](https://github.com/sourcegraph/sourcegraph-search-export)

[**➕ Add to Sourcegraph**](https://sourcegraph.com/extensions/sourcegraph/search-export) (for self-hosted instances: visit the **Extensions** page)

## Features

-   Adds an **Export to CSV** button to Sourcegraph search results pages

## Usage

1. Add the extension at https://sourcegraph.com/extensions/sourcegraph/search-export or on the **Extensions** page of your self-hosted instance.
1. Perform a search query on Sourcegraph.
1. Press the **Export to CSV** button above the list of search results. (Note: This may take a while for large result sets. The extension is not optimized for streaming or paginating results.)

## Configuration

The extension can be configured through JSON in user, organization or global settings.

```jsonc
{
    // The maximum length of the preview for each match ("Search matches" column).
    // By default, the limit is 200.
    "searchExport.maxMatchContentLength": 50
}
```

## Development

1. Run `yarn && yarn run serve` and keep the Parcel bundler process running.
1. [Sideload the extension](https://docs.sourcegraph.com/extensions/authoring/local_development) (at the URL http://localhost:1234 by default) on your Sourcegraph instance or Sourcegraph.com.

When you edit a source file in your editor, Parcel will recompile the extension. Reload the Sourcegraph web page to use run the updated extension.

## Release

Run `src extension publish` using the [Sourcegraph `src` CLI](https://github.com/sourcegraph/src-cli).
