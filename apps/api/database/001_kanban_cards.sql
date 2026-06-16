CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE kanban_issue_priority AS ENUM ('low', 'normal', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE kanban_issue_priority ADD VALUE IF NOT EXISTS 'low';
ALTER TYPE kanban_issue_priority ADD VALUE IF NOT EXISTS 'normal';
ALTER TYPE kanban_issue_priority ADD VALUE IF NOT EXISTS 'high';
ALTER TYPE kanban_issue_priority ADD VALUE IF NOT EXISTS 'critical';

DO $$
BEGIN
  CREATE TYPE kanban_issue_type AS ENUM ('task', 'bug', 'feature');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE kanban_issue_type ADD VALUE IF NOT EXISTS 'task';
ALTER TYPE kanban_issue_type ADD VALUE IF NOT EXISTS 'bug';
ALTER TYPE kanban_issue_type ADD VALUE IF NOT EXISTS 'feature';

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  lead text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS board_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS board_columns_project_key_idx
  ON board_columns(project_id, key);

CREATE INDEX IF NOT EXISTS board_columns_project_position_idx
  ON board_columns(project_id, position);

CREATE TABLE IF NOT EXISTS issue_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  column_id uuid NOT NULL REFERENCES board_columns(id) ON DELETE CASCADE,
  number integer NOT NULL,
  key text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  type kanban_issue_type NOT NULL DEFAULT 'task',
  priority kanban_issue_priority NOT NULL DEFAULT 'normal',
  state text NOT NULL DEFAULT 'Open',
  assignee_name text NOT NULL DEFAULT 'Unassigned',
  assignee_initials text NOT NULL DEFAULT 'UA',
  estimate text NOT NULL DEFAULT '',
  due_date date,
  sort_order integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  attachments_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS issue_cards_project_number_idx
  ON issue_cards(project_id, number);

CREATE INDEX IF NOT EXISTS issue_cards_column_order_idx
  ON issue_cards(column_id, sort_order);

CREATE INDEX IF NOT EXISTS issue_cards_project_idx
  ON issue_cards(project_id);

CREATE TABLE IF NOT EXISTS issue_card_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_card_id uuid NOT NULL REFERENCES issue_cards(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS issue_card_tags_card_name_idx
  ON issue_card_tags(issue_card_id, name);

CREATE INDEX IF NOT EXISTS issue_card_tags_card_position_idx
  ON issue_card_tags(issue_card_id, position);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_set_updated_at ON projects;
CREATE TRIGGER projects_set_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS board_columns_set_updated_at ON board_columns;
CREATE TRIGGER board_columns_set_updated_at
  BEFORE UPDATE ON board_columns
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS issue_cards_set_updated_at ON issue_cards;
CREATE TRIGGER issue_cards_set_updated_at
  BEFORE UPDATE ON issue_cards
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

INSERT INTO projects (id, key, name, description, lead)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  'KAN',
  'Kanban Core',
  'Issue tracking, workflows, and board primitives.',
  'Alex Morgan'
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  lead = EXCLUDED.lead;

WITH project AS (
  SELECT id FROM projects WHERE key = 'KAN'
)
INSERT INTO board_columns (id, project_id, key, title, summary, position)
SELECT *
FROM (
  VALUES
    ('31111111-1111-4111-8111-111111111111'::uuid, (SELECT id FROM project), 'backlog', 'Backlog', 'Triaged, not started', 0),
    ('31111111-1111-4111-8111-111111111112'::uuid, (SELECT id FROM project), 'in_progress', 'In progress', 'Implementation active', 1),
    ('31111111-1111-4111-8111-111111111113'::uuid, (SELECT id FROM project), 'review', 'Review', 'Waiting for validation', 2),
    ('31111111-1111-4111-8111-111111111114'::uuid, (SELECT id FROM project), 'done', 'Done', 'Released or closed', 3)
) AS seed(id, project_id, key, title, summary, position)
ON CONFLICT (project_id, key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  position = EXCLUDED.position;

WITH
project AS (
  SELECT id FROM projects WHERE key = 'KAN'
),
columns AS (
  SELECT key, id FROM board_columns WHERE project_id = (SELECT id FROM project)
)
INSERT INTO issue_cards (
  id,
  project_id,
  column_id,
  number,
  key,
  title,
  description,
  type,
  priority,
  state,
  assignee_name,
  assignee_initials,
  estimate,
  due_date,
  sort_order,
  comments_count,
  attachments_count,
  updated_at
)
SELECT *
FROM (
  VALUES
    (
      '21111111-1111-4111-8111-111111111111'::uuid,
      (SELECT id FROM project),
      (SELECT id FROM columns WHERE key = 'backlog'),
      41,
      'KAN-41',
      'Support saved issue searches with user-specific filters',
      'Persist filters, sorting, and visibility settings per user.',
      'feature'::kanban_issue_type,
      'high'::kanban_issue_priority,
      'Open',
      'Alex Johnson',
      'AJ',
      '5h',
      '2026-01-10'::date,
      0,
      6,
      2,
      '2026-06-15T18:00:00Z'::timestamptz
    ),
    (
      '21111111-1111-4111-8111-111111111112'::uuid,
      (SELECT id FROM project),
      (SELECT id FROM columns WHERE key = 'backlog'),
      43,
      'KAN-43',
      'Add project-level permissions for board visibility',
      'Define read and write access for project boards.',
      'task'::kanban_issue_type,
      'normal'::kanban_issue_priority,
      'Open',
      'Sarah Chen',
      'SC',
      '3h',
      '2026-01-15'::date,
      1,
      2,
      1,
      '2026-06-14T12:00:00Z'::timestamptz
    ),
    (
      '21111111-1111-4111-8111-111111111117'::uuid,
      (SELECT id FROM project),
      (SELECT id FROM columns WHERE key = 'backlog'),
      48,
      'KAN-48',
      'Document workflow transitions for external contributors',
      'Create contributor-facing docs for issue state changes.',
      'task'::kanban_issue_type,
      'low'::kanban_issue_priority,
      'Open',
      'Michael Rodriguez',
      'MR',
      '2h',
      '2026-01-20'::date,
      2,
      1,
      0,
      '2026-06-12T12:00:00Z'::timestamptz
    ),
    (
      '21111111-1111-4111-8111-111111111113'::uuid,
      (SELECT id FROM project),
      (SELECT id FROM columns WHERE key = 'in_progress'),
      36,
      'KAN-36',
      'Create command menu for issues, projects, and reports',
      'Add keyboard-first navigation for primary workspace actions.',
      'feature'::kanban_issue_type,
      'critical'::kanban_issue_priority,
      'In Progress',
      'Emma Wilson',
      'EW',
      '8h',
      '2026-08-25'::date,
      0,
      11,
      3,
      '2026-06-15T19:30:00Z'::timestamptz
    ),
    (
      '21111111-1111-4111-8111-111111111118'::uuid,
      (SELECT id FROM project),
      (SELECT id FROM columns WHERE key = 'in_progress'),
      39,
      'KAN-39',
      'Implement compact dark mode tokens for dense boards',
      'Tune spacing, contrast, and surface colors for long work sessions.',
      'task'::kanban_issue_type,
      'high'::kanban_issue_priority,
      'In Progress',
      'David Kim',
      'DK',
      '4h',
      '2026-08-25'::date,
      1,
      4,
      1,
      '2026-06-15T19:10:00Z'::timestamptz
    ),
    (
      '21111111-1111-4111-8111-111111111114'::uuid,
      (SELECT id FROM project),
      (SELECT id FROM columns WHERE key = 'review'),
      32,
      'KAN-32',
      'Fix stale query cache after changing issue state',
      'Invalidate board and issue detail queries after state moves.',
      'bug'::kanban_issue_type,
      'critical'::kanban_issue_priority,
      'Review',
      'Nina Patel',
      'NP',
      '1h',
      '2026-09-02'::date,
      0,
      8,
      0,
      '2026-06-15T19:50:00Z'::timestamptz
    ),
    (
      '21111111-1111-4111-8111-111111111115'::uuid,
      (SELECT id FROM project),
      (SELECT id FROM columns WHERE key = 'done'),
      1,
      'KAN-1',
      'Bootstrap monorepo with React, NestJS, and shared types',
      'Create starter workspace structure and shared package.',
      'task'::kanban_issue_type,
      'normal'::kanban_issue_priority,
      'Done',
      'Aron Thompson',
      'AT',
      '6h',
      '2026-09-25'::date,
      0,
      5,
      2,
      '2026-06-10T09:00:00Z'::timestamptz
    ),
    (
      '21111111-1111-4111-8111-111111111116'::uuid,
      (SELECT id FROM project),
      (SELECT id FROM columns WHERE key = 'done'),
      2,
      'KAN-2',
      'Add first API contract for projects and board columns',
      'Expose typed routes for project board data.',
      'task'::kanban_issue_type,
      'low'::kanban_issue_priority,
      'Done',
      'James Brown',
      'JB',
      '2h',
      '2026-09-20'::date,
      1,
      0,
      1,
      '2026-06-11T09:00:00Z'::timestamptz
    )
) AS seed(
  id,
  project_id,
  column_id,
  number,
  key,
  title,
  description,
  type,
  priority,
  state,
  assignee_name,
  assignee_initials,
  estimate,
  due_date,
  sort_order,
  comments_count,
  attachments_count,
  updated_at
)
ON CONFLICT (key) DO UPDATE SET
  project_id = EXCLUDED.project_id,
  column_id = EXCLUDED.column_id,
  number = EXCLUDED.number,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  priority = EXCLUDED.priority,
  state = EXCLUDED.state,
  assignee_name = EXCLUDED.assignee_name,
  assignee_initials = EXCLUDED.assignee_initials,
  estimate = EXCLUDED.estimate,
  due_date = EXCLUDED.due_date,
  sort_order = EXCLUDED.sort_order,
  comments_count = EXCLUDED.comments_count,
  attachments_count = EXCLUDED.attachments_count;

DELETE FROM issue_card_tags
WHERE issue_card_id IN (
  SELECT id
  FROM issue_cards
  WHERE key IN (
    'KAN-41',
    'KAN-43',
    'KAN-48',
    'KAN-36',
    'KAN-39',
    'KAN-32',
    'KAN-1',
    'KAN-2'
  )
);

INSERT INTO issue_card_tags (issue_card_id, name, position)
SELECT issue_cards.id, seed.name, seed.position
FROM (
  VALUES
    ('KAN-41', 'Search', 0),
    ('KAN-41', 'UX', 1),
    ('KAN-43', 'Access', 0),
    ('KAN-48', 'Docs', 0),
    ('KAN-36', 'Navigation', 0),
    ('KAN-36', 'Hotkeys', 1),
    ('KAN-39', 'Design', 0),
    ('KAN-32', 'API', 0),
    ('KAN-32', 'Cache', 1),
    ('KAN-1', 'Platform', 0),
    ('KAN-2', 'API', 0)
) AS seed(card_key, name, position)
JOIN issue_cards ON issue_cards.key = seed.card_key;
