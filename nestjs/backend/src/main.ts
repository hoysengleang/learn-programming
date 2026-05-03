import { NestFactory } from '@nestjs/core';
import passport from 'passport';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const origin = process.env.FRONTEND_ORIGIN?.split(',').map((item) => item.trim());

  app.use(passport.initialize());

  app.enableCors({
    origin: origin?.length ? origin : true,
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

bootstrap();
