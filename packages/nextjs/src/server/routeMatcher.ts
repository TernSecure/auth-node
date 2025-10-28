import { createPathMatcher, type WithPathPatternWildcard } from '@tern-secure/shared/pathMatcher';
import type Link from 'next/link';
import type { NextRequest } from 'next/server';

import type { Autocomplete } from '../types';

type NextTypedRoute<T = Parameters<typeof Link>['0']['href']> = T extends string ? T : never;
type RouteMatcherWithNextTypedRoutes = Autocomplete<
  WithPathPatternWildcard<NextTypedRoute> | NextTypedRoute
>;

export type RouteMatcherParams =
  | Array<RegExp | RouteMatcherWithNextTypedRoutes>
  | RouteMatcherWithNextTypedRoutes
  | RegExp
  | ((req: NextRequest) => boolean);
/**
 * Create a route matcher function for public paths
 */
export const createRouteMatcher = (routes: RouteMatcherParams) => {
  if (typeof routes === 'function') {
    return (request: NextRequest) => routes(request);
  }

  const pathMatcher = createPathMatcher(routes);
  return (request: NextRequest) => pathMatcher(request.nextUrl.pathname);
};
