module.exports = class Data1668364330420 {
  name = 'Data1668364330420'

  async up(db) {
    await db.query(`CREATE TABLE "account" ("id" character varying NOT NULL, "display" text, "legal" text, "web" text, "riot" text, "email" text, "twitter" text, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`)
  }

  async down(db) {
    await db.query(`DROP TABLE "account"`)
  }
}
