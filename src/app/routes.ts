export const ROUTES = {
    HOME: '/',
    MACHINE_CONFIG: '/config',
} as const;

// Type for route paths
export type RoutePath = typeof ROUTES[keyof typeof ROUTES]; 