import fastify, { FastifyInstance } from 'fastify';
import routes from './routes.js';
import fastifySqlite from './sqlite.js';

// In the real world, I'd use the default (minimal) pino logger for production, and pino-pretty for dev
const server: FastifyInstance = fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname'
            }
        }
    }
});

await server.register(fastifySqlite);

// Create the transaction table if it doesn't already exist
await server.sqlite.exec("CREATE TABLE IF NOT EXISTS transactions (event_type TEXT NOT NULL, date DATETIME NOT NULL, invoice_id TEXT, item_id TEXT, amount INTEGER NOT NULL, tax_rate REAL)");

server.register(routes, { prefix: '/' });

server.addHook('onClose', async (fastify) => {
    // Clean up database connection when the server shuts down
    await fastify.sqlite.close();
});

server.listen({ port: 8080 }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
});