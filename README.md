# Sourcegraph search results CSV export extension

[![Build Status](https://travis-ci.org/sourcegraph/sourcegraph-search-export.svg?branch=master)](https://travis-ci.org/sourcegraph/sourcegraph-search-export)
[![codecov](https://codecov.io/gh/sourcegraph/sourcegraph-search-export/branch/master/graph/badge.svg)](https://codecov.io/gh/sourcegraph/sourcegraph-search-export)

A [Sourcegraph extension](https://docs.sourcegraph.com/extensions) to export a list of search results to CSV.

[**🗃️ Source code**](https://github.com/sourcegraph/sourcegraph-search-export)

[**➕ Add to Sourcegraph**](https://sourcegraph.com/extensions/sourcegraph/search-export) (for self-hosted instances: visit the **Extensions** page)

## Features

-   Adds an **Export to CSV** button to Sourcegraph search results pages

## Usage

1. Add the extension at https://sourcegraph.com/extensions/sourcegraph/search-export or on the **Extensions** page of your self-hosted instance.
1. Perform a search query on Sourcegraph.
1. Press the **Export to CSV** button above the list of search results.
1. Copy the CSV from the browser devtools console.

## Development

1. Run `yarn && yarn run serve` and keep the Parcel bundler process running.
1. [Sideload the extension](https://docs.sourcegraph.com/extensions/authoring/local_development) (at the URL http://localhost:1234 by default) on your Sourcegraph instance or Sourcegraph.com.

When you edit a source file in your editor, Parcel will recompile the extension. Reload the Sourcegraph web page to use run the updated extension.

## Release

Run `src extension publish` using the [Sourcegraph `src` CLI](https://github.com/sourcegraph/src-cli).
