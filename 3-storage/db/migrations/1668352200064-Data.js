module.exports = class Data1668352200064 {
  name = 'Data1668352200064'

  async up(db) {
    await db.query(`CREATE TABLE "era_validator" ("id" character varying NOT NULL, "validator_id" text NOT NULL, "self_bonded" numeric NOT NULL, "total_bonded" numeric NOT NULL, "nominators" jsonb NOT NULL, "era_id" character varying, CONSTRAINT "PK_a376bf1356eeeaf0a43f9f7ae3f" PRIMARY KEY ("id"))`)
    await db.query(`CREATE INDEX "IDX_0f3a1de891dea5ed228469dd5e" ON "era_validator" ("era_id") `)
    await db.query(`CREATE TABLE "era" ("id" character varying NOT NULL, "index" integer NOT NULL, "started_at" integer NOT NULL, CONSTRAINT "PK_a30749cdf0189d890a8dbc9aa7d" PRIMARY KEY ("id"))`)
    await db.query(`ALTER TABLE "era_validator" ADD CONSTRAINT "FK_0f3a1de891dea5ed228469dd5e3" FOREIGN KEY ("era_id") REFERENCES "era"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  async down(db) {
    await db.query(`DROP TABLE "era_validator"`)
    await db.query(`DROP INDEX "public"."IDX_0f3a1de891dea5ed228469dd5e"`)
    await db.query(`DROP TABLE "era"`)
    await db.query(`ALTER TABLE "era_validator" DROP CONSTRAINT "FK_0f3a1de891dea5ed228469dd5e3"`)
  }
}
