import type { RouteLocation } from 'vue-router';

/**
 * Access route before routing
 *
 * @returns previousRoute
 */
export const usePreviousRoute = () => {
  const router = useRouter();
  const previousRoute = useState<RouteLocation | null>('previousRoute', () => null);

  router.beforeEach((_, from, next) => {
    previousRoute.value = from;
    next();
  });

  return previousRoute;
};
