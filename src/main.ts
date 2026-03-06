import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe to enforce DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Swagger / OpenAPI setup
  const config = new DocumentBuilder()
    .setTitle('ProSight Locus API')
    .setDescription(
      `## ProSight Locus API

A TypeScript NestJS REST API that exposes genomic locus data from the RNAcentral public PostgreSQL database.

### Authentication
Use \`POST /auth/login\` with one of the pre-defined users to receive a JWT token, then click **Authorize** and enter \`Bearer <token>\`.

### Users
| Username | Password  | Role    | Permissions |
|----------|-----------|---------|-------------|
| admin    | admin123  | admin   | All columns + sideloading |
| normal   | normal123 | normal  | rl table only, no sideloading |
| limited  | limited123| limited | regionId restricted to 3 values |
`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = parseInt(process.env.APP_PORT || '3000', 10);
  await app.listen(port);
  console.log(`🚀 Application running on: http://localhost:${port}`);
  console.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
