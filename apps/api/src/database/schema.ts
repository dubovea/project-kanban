import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const issuePriority = pgEnum("kanban_issue_priority", [
  "low",
  "normal",
  "high",
  "critical",
]);

export const issueType = pgEnum("kanban_issue_type", [
  "task",
  "bug",
  "feature",
]);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  lead: text("lead").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const boardColumns = pgTable(
  "board_columns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("board_columns_project_key_idx").on(table.projectId, table.key),
    index("board_columns_project_position_idx").on(
      table.projectId,
      table.position,
    ),
  ],
);

export const issueCards = pgTable(
  "issue_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    columnId: uuid("column_id")
      .notNull()
      .references(() => boardColumns.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    key: text("key").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    type: issueType("type").notNull().default("task"),
    priority: issuePriority("priority").notNull().default("normal"),
    state: text("state").notNull().default("Open"),
    assigneeName: text("assignee_name").notNull().default("Unassigned"),
    assigneeInitials: text("assignee_initials").notNull().default("UA"),
    estimate: text("estimate").notNull().default(""),
    dueDate: date("due_date"),
    sortOrder: integer("sort_order").notNull().default(0),
    commentsCount: integer("comments_count").notNull().default(0),
    attachmentsCount: integer("attachments_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("issue_cards_project_number_idx").on(
      table.projectId,
      table.number,
    ),
    index("issue_cards_column_order_idx").on(table.columnId, table.sortOrder),
    index("issue_cards_project_idx").on(table.projectId),
  ],
);

export const issueCardTags = pgTable(
  "issue_card_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issueCardId: uuid("issue_card_id")
      .notNull()
      .references(() => issueCards.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    uniqueIndex("issue_card_tags_card_name_idx").on(
      table.issueCardId,
      table.name,
    ),
    index("issue_card_tags_card_position_idx").on(
      table.issueCardId,
      table.position,
    ),
  ],
);

export const projectsRelations = relations(projects, ({ many }) => ({
  columns: many(boardColumns),
  issueCards: many(issueCards),
}));

export const boardColumnsRelations = relations(boardColumns, ({ many, one }) => ({
  project: one(projects, {
    fields: [boardColumns.projectId],
    references: [projects.id],
  }),
  issueCards: many(issueCards),
}));

export const issueCardsRelations = relations(issueCards, ({ many, one }) => ({
  project: one(projects, {
    fields: [issueCards.projectId],
    references: [projects.id],
  }),
  column: one(boardColumns, {
    fields: [issueCards.columnId],
    references: [boardColumns.id],
  }),
  tags: many(issueCardTags),
}));

export const issueCardTagsRelations = relations(issueCardTags, ({ one }) => ({
  issueCard: one(issueCards, {
    fields: [issueCardTags.issueCardId],
    references: [issueCards.id],
  }),
}));
