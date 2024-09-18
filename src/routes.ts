import { Static } from "@sinclair/typebox";
import { FastifyInstance } from "fastify";
import {
    SaleEvent,
    TaxPaymentEvent,
    TransactionBody,
    TaxQueryString,
    TaxQueryResponse,
    SaleAmendment
} from './types.js';

export default async function (fastify: FastifyInstance) {

    // POST transaction
    fastify.post<{ Body: Static<typeof TransactionBody> }>('/transactions', {
        schema: { body: { oneOf: [SaleEvent, TaxPaymentEvent] } }
    }, async (request, reply) => {
        const { eventType, date, invoiceId, items, amount } = request.body;
        if (eventType == "SALES") {
            for await (const { itemId, cost, taxRate } of items) {
                request.log.info(`[Transaction - Sale] Invoice ${invoiceId} (${date})\nItem: ${itemId}\nCost: ${cost}\nTax Rate: ${taxRate}`);
                // If query efficiency becomes a concern, this could be replaced with a bulk insert query
                await fastify.sqlite.run('INSERT INTO transactions (event_type, date, invoice_id, item_id, amount, tax_rate) VALUES (?, ?, ?, ?, ?, ?)', 'SALES', date, invoiceId, itemId, cost, taxRate);
            }
        } else if (eventType == "TAX_PAYMENT") {
            request.log.info(`[Transaction - Tax Payment] ${amount} GBX paid at ${date}`);
            await fastify.sqlite.run('INSERT INTO transactions (event_type, date, amount) VALUES (?, ?, ?)', 'TAX_PAYMENT', date, amount);
        }
        return reply.code(202).send();
    });

    // GET tax position
    fastify.get<{ Querystring: Static<typeof TaxQueryString>, Reply: Static<typeof TaxQueryResponse> }>('/tax-position', {
        schema: {
            querystring: TaxQueryString,
            response: {
                200: TaxQueryResponse
            }
        }
    }, async (request, reply) => {
        const { date } = request.query;
        const transactions = await fastify.sqlite.all(`
            SELECT invoice_id, item_id, amount * tax_rate as tax_owed
            FROM
                transactions
            WHERE
                event_type IN('SALES', 'ITEM_AMENDMENT')
                AND date <= ?
            ORDER BY
                date DESC`, date);
    
        // Calculate the total tax due up to the specified timestamp
        let taxOwedGbx = 0;
        const processedTransactions = new Set();
        for (const { invoice_id, item_id, tax_owed } of transactions) {
            // As the transactions are returned newest-first (but no newer than requested)
            // we only need to sum the first instance of each invoice_id and item_id combo,
            // as this will either be the original sale (if no ammendments are made), or the
            // most recent amendment.
            // Ideally this would be done at the database level, and could be using a heavier
            // DB like Postgres, but it doesn't appear to be possible with SQLite.
            const transactionUid = `${invoice_id}${item_id}`.toLowerCase();
    
            // Only process the first (most recent) instance of each transaction
            if (!processedTransactions.has(transactionUid)) {
                processedTransactions.add(transactionUid);
                taxOwedGbx += tax_owed;
            }
        }
    
        // Round taxOwed to the nearest penny
        taxOwedGbx = Math.round(taxOwedGbx);
    
        // Get the total amount of tax paid up to the specified timestamp
        const { taxPaidGbx } = await fastify.sqlite.get(`
            SELECT COALESCE(SUM(amount), 0) as taxPaidGbx
            FROM
                transactions
            WHERE
                event_type = 'TAX_PAYMENT'
                AND date <= ?`, request.query.date);
    
        const taxPosition = taxOwedGbx - taxPaidGbx;
        request.log.info(`[Tax Position] As of ${date}:\nTotal tax owed: ${taxOwedGbx} GBX\nTax paid: ${taxPaidGbx} GBX\nTax position: ${taxPosition}`);
    
        return reply.send({
            date,
            taxPosition
        });
    });
    
    // PATCH sale
    fastify.patch<{ Body: Static<typeof SaleAmendment> }>('/sale', async (request, reply) => {
        const { date, invoiceId, itemId, cost, taxRate } = request.body;
        request.log.info(`[Amending - Sale] Invoice ${invoiceId} (${date})\nItem: ${itemId}\nCost: ${cost}\nTax Rate: ${taxRate}`);
    
        await fastify.sqlite.run(`
            INSERT INTO transactions (event_type, date, invoice_id, item_id, amount, tax_rate)
            VALUES (?, ?, ?, ?, ?, ?)`,
            'ITEM_AMENDMENT', date, invoiceId, itemId, cost, taxRate);
    
        return reply.code(202).send();
    });
}