import dotenv from 'dotenv';
import path from 'path';

// Load .env file from server root
dotenv.config({ path: path.join(__dirname, '../../.env') });

export interface Config {
  PORT: number;
  OPENAI_API_KEY: string;
  GHL_API_KEY: string;
  GHL_LOCATION_ID: string;
  VAPI_API_KEY: string;
  VAPI_ASSISTANT_ID: string;
  NODE_ENV: string;
}

const getEnvOrThrow = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    console.error(`\x1b[31m[CRITICAL CONFIG ERROR] Missing required environment variable: ${key}\x1b[0m`);
    // In production we throw to prevent silent system failures.
    // In development we can warn and allow running with mock data.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing environment variable: ${key}`);
    }
    return `MOCK_${key}`;
  }
  return value;
};

export const config: Config = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  OPENAI_API_KEY: getEnvOrThrow('OPENAI_API_KEY'),
  GHL_API_KEY: getEnvOrThrow('GHL_API_KEY'),
  GHL_LOCATION_ID: getEnvOrThrow('GHL_LOCATION_ID'),
  VAPI_API_KEY: getEnvOrThrow('VAPI_API_KEY'),
  VAPI_ASSISTANT_ID: getEnvOrThrow('VAPI_ASSISTANT_ID'),
  NODE_ENV: process.env.NODE_ENV || 'development'
};

console.log(`[CONFIG] Environment configuration loaded successfully. Mode: ${config.NODE_ENV}`);
