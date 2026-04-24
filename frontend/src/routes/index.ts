// frontend/src/routes/index.ts
import { publicRoutes } from './publicRoutes';
import { protectedRoutes } from './protectedRoutes';

export const appRoutes = [...publicRoutes, protectedRoutes];
