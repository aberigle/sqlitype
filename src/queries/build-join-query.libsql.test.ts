import { describe } from 'bun:test';

import { createClient } from '@libsql/client';
import { testBuildJoinQuery } from './build-join-query.test';


describe('queries', () => describe("build-join-query (libsql)", () => testBuildJoinQuery(createClient({ url: `:memory:` }))))
