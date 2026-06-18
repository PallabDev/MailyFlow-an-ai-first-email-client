import { pgTable, text, jsonb, timestamp, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const corsairIntegrations = pgTable('corsair_integrations', {
    id: text('id').primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    name: text('name').notNull(),
    config: jsonb('config').notNull().default({}),
    dek: text('dek'),
});

export const corsairAccounts = pgTable('corsair_accounts', {
    id: text('id').primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    tenantId: text('tenant_id').notNull(),
    integrationId: text('integration_id').notNull().references(() => corsairIntegrations.id),
    config: jsonb('config').notNull().default({}),
    dek: text('dek'),
});

export const corsairEntities = pgTable('corsair_entities', {
    id: text('id').primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    accountId: text('account_id').notNull().references(() => corsairAccounts.id),
    entityId: text('entity_id').notNull(),
    entityType: text('entity_type').notNull(),
    version: text('version').notNull(),
    data: jsonb('data').notNull().default({}),
}, (table) => {
    return [
        index('entities_account_id_idx').on(table.accountId),
        index('entities_entity_type_idx').on(table.entityType),
        index('entities_entity_id_idx').on(table.entityId),
        index('entities_lookup_idx').on(table.accountId, table.entityType, table.entityId),
    ];
});

export const corsairEvents = pgTable('corsair_events', {
    id: text('id').primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    accountId: text('account_id').notNull().references(() => corsairAccounts.id),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').notNull().default({}),
    status: text('status'),
});

export const chatMessages = pgTable('chat_messages', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    role: text('role').notNull(), // 'user' | 'assistant'
    content: text('content').notNull(),
    status: text('status').notNull(), // 'pending' | 'completed' | 'failed' | 'cancelled'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const healthLogs = pgTable('health_logs', {
    id: text('id').primaryKey(),
    status: text('status').notNull(),
    message: text('message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userSubscriptions = pgTable('user_subscriptions', {
    userId: text('user_id').primaryKey(),
    planName: text('plan_name').notNull().default('Starter'), // 'Starter' | 'Professional' | 'Business'
    status: text('status').notNull().default('active'), // 'active' | 'cancelled'
    razorpaySubscriptionId: text('razorpay_subscription_id'),
    razorpayPaymentId: text('razorpay_payment_id'),
    price: text('price').notNull().default('0'),
    startDate: timestamp('start_date', { withTimezone: true }).notNull().defaultNow(),
    endDate: timestamp('end_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userUsage = pgTable('user_usage', {
  userId: text('user_id').primaryKey(),
  aiCallsCount: integer('ai_calls_count').notNull().default(0),
  gmailCallsCount: integer('gmail_calls_count').notNull().default(0),
  calendarCallsCount: integer('calendar_calls_count').notNull().default(0),
  summaryCallsCount: integer('summary_calls_count').notNull().default(0),
  replyCallsCount: integer('reply_calls_count').notNull().default(0),
  lastResetDate: text('last_reset_date').notNull(), // 'YYYY-MM-DD'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const emailPriorities = pgTable('email_priorities', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  emailId: text('email_id').notNull(),
  priority: integer('priority').notNull().default(3), // 1=urgent, 2=important, 3=normal, 4=low, 5=promo
  category: text('category').notNull().default('normal'), // urgent, work, personal, promotional, spam
  reason: text('reason').notNull().default(''),
  scoredAt: timestamp('scored_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return [
    index('email_priorities_user_id_idx').on(table.userId),
    index('email_priorities_email_id_idx').on(table.emailId),
    index('email_priorities_user_email_idx').on(table.userId, table.emailId),
  ];
});

export const webhookDedup = pgTable('webhook_dedup', {
  tenantId: text('tenant_id').notNull(),
  messageId: text('message_id').notNull(),
  seenAt: timestamp('seen_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return [
    uniqueIndex('webhook_dedup_tenant_msg_idx').on(table.tenantId, table.messageId),
    index('webhook_dedup_seen_at_idx').on(table.seenAt),
  ];
});




