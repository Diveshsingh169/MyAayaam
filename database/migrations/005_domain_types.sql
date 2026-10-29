BEGIN;

-- Purchase status: preserve existing values and add draft.
ALTER TABLE purchases
    DROP CONSTRAINT IF EXISTS purchases_status_check;

ALTER TABLE purchases
    ADD CONSTRAINT purchases_status_check
    CHECK (
        status IN (
            'draft',
            'pending',
            'completed',
            'cancelled'
        )
    );

-- Sale payment status: preserve existing values and add refunded.
ALTER TABLE sales
    DROP CONSTRAINT IF EXISTS sales_payment_status_check;

ALTER TABLE sales
    ADD CONSTRAINT sales_payment_status_check
    CHECK (
        payment_status IN (
            'paid',
            'pending',
            'partial',
            'refunded'
        )
    );

-- Inventory movement type: preserve existing values and add reversal.
ALTER TABLE inventory_movements
    DROP CONSTRAINT IF EXISTS inventory_movements_movement_type_check;

ALTER TABLE inventory_movements
    ADD CONSTRAINT inventory_movements_movement_type_check
    CHECK (
        movement_type IN (
            'purchase',
            'sale',
            'adjustment',
            'return',
            'reversal'
        )
    );

COMMIT;
