import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { beforeAll, beforeEach, afterAll } from '@jest/globals';
import { ConfigModule } from '@nestjs/config';

let app: INestApplication;
let dataSource: DataSource;

async function createTestDatabase() {
  const client = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: 'postgres'
  });

  try {
    await client.connect();
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME_TEST]
    );
    
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE ${process.env.DB_NAME_TEST}`);
    }
  } catch (error) {
    console.error('Error setting up test database:', error);
  } finally {
    await client.end();
  }
}

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  dotenv.config({ path: '.env.test' });
  process.env.JWT_SECRET = 'test-secret-key';
  
  try {
    await createTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    dataSource = moduleFixture.get(DataSource);
  } catch (error) {
    console.error('Error in test setup:', error);
    throw error;
  }
}, 30000);

beforeEach(async () => {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.synchronize(true);
  }
});

afterAll(async () => {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
  }
  if (app) {
    await app.close();
  }
});

export { app, dataSource };
