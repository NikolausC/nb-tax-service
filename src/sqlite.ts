import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';

declare module 'fastify' {
    interface FastifyInstance {
        sqlite: Database
    }
}

const sqliteWrapperAsync: FastifyPluginAsync = async (fastify, options) => {
    const db = await open({
        filename: './transactions.db',
        driver: sqlite3.cached.Database
    });

    fastify.decorate('sqlite', db);
}

export default fp(sqliteWrapperAsync);