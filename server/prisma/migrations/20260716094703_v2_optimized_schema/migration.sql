-- CreateTable
CREATE TABLE "staff" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "avatar_url" TEXT,
    "commission_type" TEXT,
    "commission_value" REAL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "hired_date" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "wechat_id" TEXT,
    "avatar_url" TEXT,
    "address" TEXT,
    "source" TEXT,
    "total_spent" REAL NOT NULL DEFAULT 0,
    "last_visit_date" TEXT,
    "visit_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "pet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "breed" TEXT,
    "gender" TEXT,
    "is_neutered" BOOLEAN NOT NULL DEFAULT false,
    "birth_date" TEXT,
    "weight_kg" REAL,
    "color" TEXT,
    "vaccine_expiry" TEXT,
    "avatar_url" TEXT,
    "cover_image" TEXT,
    "is_aggressive" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pet_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pet_note" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pet_id" INTEGER NOT NULL,
    "staff_id" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pet_note_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pet_note_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "member_price" REAL,
    "duration_minutes" INTEGER NOT NULL,
    "commission_amount" REAL NOT NULL DEFAULT 0,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "appointment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "appointment_no" TEXT NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "pet_id" INTEGER NOT NULL,
    "staff_id" INTEGER,
    "appointment_date" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source" TEXT NOT NULL DEFAULT 'phone',
    "notes" TEXT,
    "created_by" INTEGER NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "appointment_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "appointment_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "appointment_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "appointment_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "appointment_item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "appointment_id" INTEGER NOT NULL,
    "service_id" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "commission_amount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "appointment_item_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "appointment_item_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "appointment_id" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "method" TEXT NOT NULL,
    "transaction_no" TEXT,
    "paid_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER NOT NULL,
    "notes" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payment_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payment_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "boarding" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pet_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "appointment_id" INTEGER,
    "cage_no" TEXT NOT NULL,
    "check_in_date" TEXT NOT NULL,
    "check_out_date" TEXT NOT NULL,
    "actual_check_out" TEXT,
    "daily_rate" REAL NOT NULL,
    "total_amount" REAL NOT NULL DEFAULT 0,
    "deposit" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "brought_items" TEXT,
    "emergency_contact" TEXT,
    "notes" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "boarding_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "boarding_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "boarding_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "care_log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "boarding_id" INTEGER NOT NULL,
    "staff_id" INTEGER NOT NULL,
    "log_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "photo_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "care_log_boarding_id_fkey" FOREIGN KEY ("boarding_id") REFERENCES "boarding" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "care_log_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "membership_card" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer_id" INTEGER NOT NULL,
    "card_type" TEXT NOT NULL,
    "card_no" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0,
    "total_times" INTEGER NOT NULL DEFAULT 0,
    "used_times" INTEGER NOT NULL DEFAULT 0,
    "discount_rate" REAL NOT NULL DEFAULT 1.0,
    "issued_date" TEXT NOT NULL,
    "expiry_date" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "membership_card_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "card_transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "card_id" INTEGER NOT NULL,
    "appointment_id" INTEGER,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL DEFAULT 0,
    "times" INTEGER NOT NULL DEFAULT 0,
    "balance_after" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "card_transaction_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "membership_card" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '个',
    "current_stock" REAL NOT NULL DEFAULT 0,
    "safety_stock" REAL NOT NULL DEFAULT 0,
    "cost_price" REAL NOT NULL DEFAULT 0,
    "retail_price" REAL NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "inventory_log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "product_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "related_appointment_id" INTEGER,
    "created_by" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_log_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "inventory_log_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "schedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "staff_id" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "max_appointments" INTEGER NOT NULL DEFAULT 10,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "schedule_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_phone_key" ON "staff"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "customer_phone_key" ON "customer"("phone");

-- CreateIndex
CREATE INDEX "pet_customer_id_idx" ON "pet"("customer_id");

-- CreateIndex
CREATE INDEX "pet_note_pet_id_idx" ON "pet_note"("pet_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_appointment_no_key" ON "appointment"("appointment_no");

-- CreateIndex
CREATE INDEX "appointment_appointment_date_idx" ON "appointment"("appointment_date");

-- CreateIndex
CREATE INDEX "appointment_status_idx" ON "appointment"("status");

-- CreateIndex
CREATE INDEX "appointment_customer_id_idx" ON "appointment"("customer_id");

-- CreateIndex
CREATE INDEX "appointment_item_appointment_id_idx" ON "appointment_item"("appointment_id");

-- CreateIndex
CREATE INDEX "payment_appointment_id_idx" ON "payment"("appointment_id");

-- CreateIndex
CREATE INDEX "payment_paid_at_idx" ON "payment"("paid_at");

-- CreateIndex
CREATE UNIQUE INDEX "boarding_appointment_id_key" ON "boarding"("appointment_id");

-- CreateIndex
CREATE INDEX "boarding_status_idx" ON "boarding"("status");

-- CreateIndex
CREATE INDEX "boarding_pet_id_idx" ON "boarding"("pet_id");

-- CreateIndex
CREATE INDEX "care_log_boarding_id_idx" ON "care_log"("boarding_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_card_card_no_key" ON "membership_card"("card_no");

-- CreateIndex
CREATE INDEX "membership_card_customer_id_idx" ON "membership_card"("customer_id");

-- CreateIndex
CREATE INDEX "card_transaction_card_id_idx" ON "card_transaction"("card_id");

-- CreateIndex
CREATE INDEX "inventory_log_product_id_idx" ON "inventory_log"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_staff_id_date_key" ON "schedule"("staff_id", "date");
