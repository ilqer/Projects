-- Seed default tags for every existing user
INSERT INTO tags (name, color, description, created_by)
SELECT
  'ai-created',
  '#6366F1',
  'Automatically assigned to artifacts created by AI approval.',
  u.id
FROM users u
ON CONFLICT (name, created_by) DO NOTHING;

INSERT INTO tags (name, color, description, created_by)
SELECT
  'user-created',
  '#22C55E',
  'Automatically assigned to artifacts uploaded manually by the user.',
  u.id
FROM users u
ON CONFLICT (name, created_by) DO NOTHING;
