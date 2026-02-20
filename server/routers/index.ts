import { router } from '../trpc'; // ajuste path se necessário
import { paymentRouter } from './payment';
// Importe outros routers que já existam, ex:
// import { rideRouter } from './ride';
// import { userRouter } from './user';

export const appRouter = router({
  payment: paymentRouter,
  // ride: rideRouter,
  // user: userRouter,
  // ... adicione os outros
});

export type AppRouter = typeof appRouter;
