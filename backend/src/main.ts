import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('CORS');

  const rawOrigins = process.env.FRONTEND_URL || 'http://localhost:5173';
  const allowedOrigins = rawOrigins
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, '').toLowerCase())
    .filter(Boolean);

  logger.log(`FRONTEND_URL lida: "${process.env.FRONTEND_URL}"`);
  logger.log(`Origens permitidas: ${JSON.stringify(allowedOrigins)}`);

  // Enable CORS
  app.enableCors({
    origin: (origin, callback) => {
      const normalized = origin
        ? origin.trim().replace(/\/+$/, '').toLowerCase()
        : origin;

      if (!origin || allowedOrigins.includes(normalized)) {
        callback(null, true);
      } else {
        logger.warn(
          `Origin rejeitado: "${origin}" (permitidos: ${JSON.stringify(
            allowedOrigins
          )})`
        );
        callback(new Error('Origin não permitido por CORS.'));
      }
    },
    credentials: true,
  });

  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
