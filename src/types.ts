import { Type } from '@sinclair/typebox';

const Item = Type.Object({
    itemId: Type.String(),
    cost: Type.Integer(),
    taxRate: Type.Number()
});

const SaleEvent = Type.Object({
    eventType: Type.Literal("SALES"), // Unfortunately, this is case-sensitive
    date: Type.String({ format: 'date-time' }), // Type.Date() isn't supported by Ajv
    invoiceId: Type.String(),
    items: Type.Array(Item, { minItems: 1 })
});

const TaxPaymentEvent = Type.Object({
    eventType: Type.Literal("TAX_PAYMENT"),
    date: Type.String({ format: 'date-time' }),
    amount: Type.Integer()
});

// TransactionBody as a Composite type may not be the best way to do this, but this is my first time using TypeScript.
const TransactionBody = Type.Composite([SaleEvent, TaxPaymentEvent]);

const TaxQueryString = Type.Object({
    date: Type.String({ format: 'date-time' })
});

const TaxQueryResponse = Type.Object({
    date: Type.String({ format: 'date-time' }),
    taxPosition: Type.Integer()
});

const SaleAmendment = Type.Intersect([
    Type.Object({
        date: Type.String({ format: 'date-time' }),
        invoiceId: Type.String(),
    }),
    Item
]);

export {
    SaleEvent,
    TaxPaymentEvent,
    TransactionBody,
    TaxQueryString,
    TaxQueryResponse,
    SaleAmendment
}