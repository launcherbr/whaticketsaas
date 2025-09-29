import * as http from 'http';

declare module 'http' {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
} 