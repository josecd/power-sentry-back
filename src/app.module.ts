import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ShellyModule } from './shelly/shelly.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { configurationEnv } from './configuration';

@Module({
  imports: [ 
    ShellyModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configurationEnv]
    }),
    TypeOrmModule.forRoot({
      type: "mysql",
      host: process.env.HOST_BD,
      port: 3306,
      username: process.env.USERNAME_BD,
      password: process.env.PASSWORD_BD,
      database: process.env.DATABASE,
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: true
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
