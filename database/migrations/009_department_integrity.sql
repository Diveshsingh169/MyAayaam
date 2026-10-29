SELECT
    child.relname AS table_name,
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class child
    ON child.oid = con.conrelid
JOIN pg_namespace ns
    ON ns.oid = child.relnamespace
WHERE ns.nspname = 'public'
  AND con.contype = 'f'
ORDER BY child.relname, con.conname;
