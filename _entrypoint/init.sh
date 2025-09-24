#!/bin/bash
set -e

echo "---------------------------------------------"
echo "Setting up PostgreSQL database: $POSTGRES_DB"
echo "Creating application user: $POSTGRES_APP_USER"
echo "---------------------------------------------"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"<<-EOSQL
    REVOKE CONNECT ON DATABASE $POSTGRES_DB FROM public;
    REVOKE ALL ON SCHEMA public FROM PUBLIC;
    CREATE USER $POSTGRES_APP_USER WITH PASSWORD '$POSTGRES_APP_PASSWORD';
    CREATE SCHEMA drizzle;
    GRANT ALL ON DATABASE $POSTGRES_DB TO $POSTGRES_APP_USER;
    GRANT ALL ON SCHEMA public TO $POSTGRES_APP_USER;
    GRANT ALL ON SCHEMA drizzle TO $POSTGRES_APP_USER;
EOSQL