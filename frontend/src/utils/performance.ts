import { useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import _ from 'lodash';

/**
 * Create a debounced version of a function
 * @param func Function to debounce
 * @param wait Waiting time in milliseconds
 */
export function useDebounce<F extends (...args: any[]) => any>(
  func: F, 
  wait = 300
): F {
  return useCallback(
    debounce(func, wait) as F,
    [func, wait]
  );
}

/**
 * Memoize complex calculations with optional dependency tracking
 * @param calculator Function to memoize
 * @param dependencies Dependencies to watch
 */
export function useMemoizedCalculation<T>(
  calculator: () => T, 
  dependencies: any[]
): T {
  return useMemo(calculator, dependencies);
}

/**
 * Create a throttled version of a function
 * @param func Function to throttle
 * @param limit Time limit in milliseconds
 */
export function useThrottle<F extends (...args: any[]) => any>(
  func: F, 
  limit = 300
): F {
  return useCallback(
    _.throttle(func, limit) as unknown as F,
    [func, limit]
  );
}