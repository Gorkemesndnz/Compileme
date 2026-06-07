INSERT INTO app_user (id, display_name, created_at)
VALUES (1, 'Görkem', now())
ON CONFLICT (id) DO NOTHING;

-- Sync serial sequence for app_user
SELECT setval(pg_get_serial_sequence('app_user', 'id'), COALESCE(MAX(id), 1)) FROM app_user;

INSERT INTO settings (user_id, water_goal_ml, weather_city, theme, focus_brightness, focus_temperature)
VALUES (1, 3000, 'İstanbul', 'DARK', 77, 'NEUTRAL')
ON CONFLICT (user_id) DO NOTHING;
