CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar,
	"is_active" boolean DEFAULT true,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admins_username_unique" UNIQUE("username"),
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "analytics_daily_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"total_visitors" integer DEFAULT 0,
	"new_visitors" integer DEFAULT 0,
	"returning_visitors" integer DEFAULT 0,
	"total_page_views" integer DEFAULT 0,
	"total_sessions" integer DEFAULT 0,
	"average_session_duration" integer DEFAULT 0,
	"bounce_rate" numeric(5, 2) DEFAULT '0',
	"top_pages" jsonb,
	"top_countries" jsonb,
	"device_breakdown" jsonb,
	"browser_breakdown" jsonb
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar,
	"event_type" varchar(100) NOT NULL,
	"event_category" varchar(100),
	"event_data" jsonb,
	"page_path" varchar(500),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "analytics_page_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar,
	"page_path" varchar(500) NOT NULL,
	"page_title" varchar(500),
	"referrer" varchar(500),
	"user_agent" text,
	"ip_address" varchar(50),
	"country" varchar(100),
	"city" varchar(100),
	"device_type" varchar(50),
	"browser" varchar(100),
	"os" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "analytics_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar,
	"first_visit" timestamp DEFAULT now(),
	"last_activity" timestamp DEFAULT now(),
	"page_view_count" integer DEFAULT 0,
	"country" varchar(100),
	"city" varchar(100),
	"device_type" varchar(50),
	"browser" varchar(100),
	"os" varchar(100),
	"ip_address" varchar(50),
	"user_agent" text,
	"is_bot" boolean DEFAULT false,
	"landing_page" varchar(500),
	"referrer" varchar(500),
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	CONSTRAINT "analytics_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" varchar(100) NOT NULL,
	"action" varchar(20) NOT NULL,
	"user_id" varchar,
	"admin_id" integer,
	"old_data" text,
	"new_data" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_urls" text[] NOT NULL,
	"page_type" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "book_categories" (
	"book_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "book_categories_book_id_category_id_unique" UNIQUE("book_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "book_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" varchar(200) NOT NULL,
	"customer_email" varchar(200) NOT NULL,
	"customer_phone" varchar(20),
	"book_title" varchar(500) NOT NULL,
	"author" varchar(300),
	"isbn" varchar(20) NOT NULL,
	"binding" varchar(50) NOT NULL,
	"expected_price" numeric(10, 2),
	"quantity" integer DEFAULT 1,
	"notes" text,
	"status" varchar(50) DEFAULT 'pending',
	"admin_notes" text,
	"processed_by" integer,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"author" varchar(300) NOT NULL,
	"isbn" varchar(20),
	"category_id" integer,
	"description" text,
	"condition" varchar(50) NOT NULL,
	"binding" varchar(50) DEFAULT 'No Binding',
	"price" numeric(10, 2) NOT NULL,
	"stock" integer DEFAULT 0,
	"image_url" varchar(500),
	"image_url_2" varchar(500),
	"image_url_3" varchar(500),
	"published_year" integer,
	"publisher" varchar(200),
	"pages" integer,
	"language" varchar(50) DEFAULT 'English',
	"edition" varchar(100),
	"weight" numeric(5, 2),
	"dimensions" varchar(100),
	"featured" boolean DEFAULT false,
	"bestseller" boolean DEFAULT false,
	"trending" boolean DEFAULT false,
	"new_arrival" boolean DEFAULT false,
	"box_set" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"book_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"sort_order" integer,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(200) NOT NULL,
	"subject" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(50) DEFAULT 'unread',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coupon_usages" (
	"id" serial PRIMARY KEY NOT NULL,
	"coupon_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"user_id" varchar,
	"customer_email" varchar NOT NULL,
	"discount_amount" numeric(10, 2) NOT NULL,
	"used_at" timestamp DEFAULT now(),
	CONSTRAINT "coupon_usages_coupon_id_customer_email_unique" UNIQUE("coupon_id","customer_email")
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"discount_type" varchar NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"minimum_order_amount" numeric(10, 2) DEFAULT '0',
	"maximum_discount_amount" numeric(10, 2),
	"usage_limit" integer,
	"used_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "gift_cart" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"gift_category_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"note" text,
	"engrave" boolean DEFAULT false NOT NULL,
	"engraving_message" text
);
--> statement-breakpoint
CREATE TABLE "gift_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" text,
	"image_url" text,
	"image_url_2" text,
	"image_url_3" text,
	"price" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_engraving_allowed" boolean DEFAULT false NOT NULL,
	"engraving_character_limit" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "homepage_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"section" varchar(100) NOT NULL,
	"title" varchar(255),
	"subtitle" text,
	"content" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"settings" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"book_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"title" varchar(500) NOT NULL,
	"author" varchar(300) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(50),
	"user_id" varchar,
	"customer_email" varchar NOT NULL,
	"customer_name" varchar NOT NULL,
	"customer_phone" varchar,
	"shipping_address" jsonb NOT NULL,
	"billing_address" jsonb NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"shipping" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"payment_status" varchar(50) DEFAULT 'pending',
	"payment_id" varchar(200),
	"payment_method" varchar(50),
	"tracking_number" varchar(100),
	"shipping_carrier" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "refund_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"return_request_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"refund_amount" numeric(10, 2) NOT NULL,
	"refund_method" varchar NOT NULL,
	"original_payment_method" varchar,
	"original_transaction_id" varchar,
	"refund_transaction_id" varchar,
	"refund_status" varchar DEFAULT 'pending',
	"refund_reason" text,
	"processed_by" integer,
	"processed_at" timestamp,
	"gateway_response" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "return_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"return_request_number" varchar NOT NULL,
	"order_id" integer NOT NULL,
	"user_id" varchar,
	"customer_email" varchar NOT NULL,
	"customer_name" varchar NOT NULL,
	"return_reason" varchar NOT NULL,
	"return_description" text NOT NULL,
	"items_to_return" jsonb NOT NULL,
	"total_refund_amount" numeric(10, 2) NOT NULL,
	"status" varchar DEFAULT 'pending',
	"admin_notes" text,
	"refund_method" varchar,
	"refund_transaction_id" varchar,
	"refund_processed_at" timestamp,
	"return_deadline" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "return_requests_return_request_number_unique" UNIQUE("return_request_number"),
	CONSTRAINT "return_requests_order_id_user_id_unique" UNIQUE("order_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_code" varchar(20) NOT NULL,
	"country_name" varchar(100) NOT NULL,
	"shipping_cost" numeric(10, 2) NOT NULL,
	"min_delivery_days" integer NOT NULL,
	"max_delivery_days" integer NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_name" varchar(255) NOT NULL,
	"store_email" varchar(255) NOT NULL,
	"store_description" text,
	"store_phone" varchar(50),
	"currency" varchar(10) DEFAULT 'EUR' NOT NULL,
	"store_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"phone" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'customer',
	"password_hash" varchar,
	"is_email_verified" boolean DEFAULT false,
	"auth_provider" varchar DEFAULT 'email',
	"reset_token" varchar,
	"reset_token_expiry" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "wishlist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"book_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_page_views" ADD CONSTRAINT "analytics_page_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_sessions" ADD CONSTRAINT "analytics_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_categories" ADD CONSTRAINT "book_categories_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_categories" ADD CONSTRAINT "book_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_requests" ADD CONSTRAINT "book_requests_processed_by_admins_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_cart" ADD CONSTRAINT "gift_cart_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_cart" ADD CONSTRAINT "gift_cart_gift_category_id_gift_categories_id_fk" FOREIGN KEY ("gift_category_id") REFERENCES "public"."gift_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_return_request_id_return_requests_id_fk" FOREIGN KEY ("return_request_id") REFERENCES "public"."return_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_processed_by_admins_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_daily_stats_date" ON "analytics_daily_stats" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_events_session" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_events_type" ON "analytics_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_events_created" ON "analytics_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_page_views_session" ON "analytics_page_views" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_page_views_path" ON "analytics_page_views" USING btree ("page_path");--> statement-breakpoint
CREATE INDEX "idx_page_views_created" ON "analytics_page_views" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_id" ON "analytics_sessions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_first_visit" ON "analytics_sessions" USING btree ("first_visit");--> statement-breakpoint
CREATE INDEX "idx_audit_table_record" ON "audit_logs" USING btree ("table_name","record_id");--> statement-breakpoint
CREATE INDEX "idx_audit_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_created_at" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_admin" ON "audit_logs" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_audit_user" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");