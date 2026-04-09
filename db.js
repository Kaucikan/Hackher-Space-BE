const pool = new Pool({
  host: "db.gfaywafcqklmujmtmbab.supabase.co",
  port: 5432,
  user: "postgres",
  password: "xh9ueAt3n8OeDbUk",
  database: "postgres",
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
  family: 4,
});
