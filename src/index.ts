import { createAppContext } from './infrastructure/composition/appContext';
import { createServer } from './infrastructure/HTTP/createServer';

async function bootstrap() {
      const ctx = createAppContext();
      const app = createServer(ctx);

      const port = Number(process.env.PORT) || 3000;
      const host = process.env.HOST || '0.0.0.0';

      try {
            await app.listen({ port, host });
            app.log.info(`Server listening on http://${host}:${port}`);
      } catch (err) {
            app.log.error(err);
            process.exit(1);
      }
}

bootstrap().catch((error) => {
      console.error('Failed to bootstrap application:', error);
      process.exit(1);
});
