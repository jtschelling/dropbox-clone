CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE EXTENSION pgcrypto;
CREATE TABLE "users" (
    "id" bigserial PRIMARY KEY,
    "username" text NOT NULL UNIQUE,
    "password" text NOT NULL,
    "type" text
);
INSERT INTO users (username, password, type) VALUES (
    'jt@schelling.io',
    crypt('password', gen_salt('bf')),
    'user'
);
