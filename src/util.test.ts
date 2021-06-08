import * as assert from 'assert'
import { queryHasCount } from './util'

describe('extension', () => {
    describe('queryHasCount()', () => {
        it('returns true when count is specified', () => {
            assert.strictEqual(queryHasCount('const count:1000'), true)
        })

        it('returns false when count is not specified', () => {
            assert.strictEqual(queryHasCount('const'), false)
        })

        it('returns false when count is escaped', () => {
            assert.strictEqual(queryHasCount('"count:100" lang:ts'), false)
        })
    })
})
