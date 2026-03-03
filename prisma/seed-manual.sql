-- Вставь в Supabase: SQL Editor → New query → вставь весь код ниже → Run.
-- Пароль админа: admin123

INSERT INTO "Admin" (id, email, "passwordHash", name, "createdAt", "updatedAt")
VALUES (
  coalesce((SELECT id FROM "Admin" WHERE email = 'admin@porodacosmetics.ru' LIMIT 1), 'c' || substr(md5(random()::text), 1, 24)),
  'admin@porodacosmetics.ru',
  '$2b$10$aAvZVGvJf7Rw1dyxXRCGy.OmSy1P4kTHw9ISn5grsZNECbfCLIHn2',
  'Администратор',
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", name = EXCLUDED.name, "updatedAt" = now();

INSERT INTO "Category" (id, slug, title, "sortOrder")
VALUES
  (gen_random_uuid()::text, 'cleansing', 'Очищение', 1),
  (gen_random_uuid()::text, 'serums', 'Сыворотки', 2),
  (gen_random_uuid()::text, 'creams', 'Кремы', 3),
  (gen_random_uuid()::text, 'sets', 'Наборы', 4),
  (gen_random_uuid()::text, 'toners', 'Тонизация', 5),
  (gen_random_uuid()::text, 'masks', 'Маски', 6)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO "Product" (id, slug, title, "shortDesc", "categoryId", price, "isNew", "imageUrl", "imageUrls", "skinTypes", "sortOrder", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  v.slug,
  v.title,
  v."shortDesc",
  (SELECT id FROM "Category" WHERE slug = v.cat_slug LIMIT 1),
  v.price,
  coalesce(v."isNew", false),
  v."imageUrl",
  ARRAY[v."imageUrl"]::text[],
  ARRAY['все типы']::text[],
  v."sortOrder",
  now(),
  now()
FROM (VALUES
  ('gel-umyvanie', 'Гель для умывания', 'Бережное очищение кожи. Подходит для ежедневного ухода.', 'cleansing', 890, false, '/images/poroda/1/1.jpg', 10),
  ('tonik-aktivator', 'Тоник-активатор', 'Подготавливает кожу к нанесению сывороток и кремов. Тонизирует и освежает.', 'toners', 950, false, '/images/poroda/2/1.jpg', 11),
  ('syvorotka-niacinamide', 'Сыворотка с ниацинамидом', 'Выравнивает тон кожи, уменьшает воспаления. Для комбинированной и жирной кожи.', 'serums', 1450, true, '/images/poroda/3/1.jpg', 12),
  ('krem-vokrug-glaz', 'Крем вокруг глаз', 'Уход за нежной кожей вокруг глаз. Увлажнение и уменьшение отёчности.', 'creams', 1290, false, '/images/poroda/4/1.jpg', 13),
  ('krem-oranzhevyy', 'Крем оранжевый', 'Питательный крем с витаминами. Сияние и упругость кожи.', 'creams', 1590, false, '/images/poroda/5/1.jpg', 14),
  ('pudra-enzimnaya', 'Пудра энзимная для умывания', 'Мягкое ферментное очищение. Подходит для чувствительной кожи.', 'cleansing', 1287, false, '/images/poroda/6/1.jpg', 15),
  ('flyuid', 'Флюид', 'Лёгкая текстура, быстрое впитывание. Увлажнение без липкости.', 'creams', 1190, false, '/images/poroda/7/1.jpg', 16)
) AS v(slug, title, "shortDesc", cat_slug, price, "isNew", "imageUrl", "sortOrder")
WHERE NOT EXISTS (SELECT 1 FROM "Product" WHERE slug = v.slug);

INSERT INTO "Promo" (id, code, percent, description, "maxUses", "usedCount", active, "createdAt", "updatedAt")
VALUES (
  coalesce((SELECT id FROM "Promo" WHERE code = 'WELCOME10' LIMIT 1), gen_random_uuid()::text),
  'WELCOME10',
  10,
  'Приветственная скидка 10%',
  1000,
  0,
  true,
  now(),
  now()
)
ON CONFLICT (code) DO NOTHING;
