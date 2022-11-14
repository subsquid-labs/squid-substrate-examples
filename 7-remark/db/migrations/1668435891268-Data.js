module.exports = class Data1668435891268 {
  name = 'Data1668435891268'

  async up(db) {
    await db.query(`CREATE TABLE "rmrk_nft" ("id" character varying NOT NULL, "symbol" text, "transferable" boolean, "collection" text NOT NULL, "issuer" text, "sn" text, "metadata" text, "owner_id" character varying, "parent_id" character varying, CONSTRAINT "PK_06cea93e5f3a8e395f5f7b29521" PRIMARY KEY ("id"))`)
    await db.query(`CREATE INDEX "IDX_dbf163f1e874f2dda345897380" ON "rmrk_nft" ("owner_id") `)
    await db.query(`CREATE INDEX "IDX_53927fb20d7fdde2dc4eb2c497" ON "rmrk_nft" ("parent_id") `)
    await db.query(`CREATE TABLE "account" ("id" character varying NOT NULL, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`)
    await db.query(`ALTER TABLE "rmrk_nft" ADD CONSTRAINT "FK_dbf163f1e874f2dda3458973807" FOREIGN KEY ("owner_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await db.query(`ALTER TABLE "rmrk_nft" ADD CONSTRAINT "FK_53927fb20d7fdde2dc4eb2c4974" FOREIGN KEY ("parent_id") REFERENCES "rmrk_nft"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  async down(db) {
    await db.query(`DROP TABLE "rmrk_nft"`)
    await db.query(`DROP INDEX "public"."IDX_dbf163f1e874f2dda345897380"`)
    await db.query(`DROP INDEX "public"."IDX_53927fb20d7fdde2dc4eb2c497"`)
    await db.query(`DROP TABLE "account"`)
    await db.query(`ALTER TABLE "rmrk_nft" DROP CONSTRAINT "FK_dbf163f1e874f2dda3458973807"`)
    await db.query(`ALTER TABLE "rmrk_nft" DROP CONSTRAINT "FK_53927fb20d7fdde2dc4eb2c4974"`)
  }
}
