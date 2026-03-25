
-- Insert Drinks products with inventory tracking
INSERT INTO products (name, price, category_id, inventory_tracking, stock_count, is_available, active, archived)
SELECT v.name, v.price, '6db3c05f-5fb7-487f-affb-c4b9652ea946'::uuid, true, v.stock, true, true, false
FROM (VALUES
  ('Classic Iced Tea', 3.99, 48),
  ('Peach Iced Tea', 4.49, 36),
  ('Arnold Palmer', 4.99, 30),
  ('Raspberry Iced Tea', 4.49, 36),
  ('Green Iced Tea', 3.99, 42),
  ('Mango Iced Tea', 4.49, 30),
  ('Passion Fruit Iced Tea', 4.49, 24),
  ('Sweet Tea', 3.49, 48),
  ('Unsweetened Iced Tea', 3.49, 48),
  ('Coca Cola', 2.99, 72),
  ('Sprite', 2.99, 72),
  ('Ginger Ale', 2.99, 48),
  ('Dr Pepper', 2.99, 48),
  ('Root Beer', 2.99, 48),
  ('Fanta Orange', 2.99, 48),
  ('Lemonade', 3.49, 60),
  ('Club Soda', 2.49, 72),
  ('Tonic Water', 2.49, 72),
  ('Classic Lemonade', 3.99, 48),
  ('Strawberry Lemonade', 4.49, 36),
  ('Raspberry Lemonade', 4.49, 36),
  ('Lavender Lemonade', 4.99, 24),
  ('Mango Lemonade', 4.49, 30),
  ('Blueberry Lemonade', 4.49, 30),
  ('Mint Lemonade', 4.49, 36),
  ('Watermelon Lemonade', 4.49, 30),
  ('Fresh Squeezed Lemonade', 4.99, 24)
) AS v(name, price, stock)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.name = v.name AND p.category_id = '6db3c05f-5fb7-487f-affb-c4b9652ea946'::uuid
);

-- Insert Spirits products with inventory tracking
INSERT INTO products (name, price, category_id, inventory_tracking, stock_count, is_available, active, archived)
SELECT v.name, v.price, '01369c9c-80a1-4890-b2b3-f4056e47804a'::uuid, true, v.stock, true, true, false
FROM (VALUES
  ('Jack Daniels', 9.99, 18),
  ('Jim Beam', 8.99, 24),
  ('Maker''s Mark', 11.99, 12),
  ('Woodford Reserve', 13.99, 10),
  ('Buffalo Trace', 11.99, 15),
  ('Bulleit Bourbon', 11.99, 12),
  ('Jameson Irish', 10.99, 18),
  ('Crown Royal', 10.99, 15),
  ('Johnny Walker Black', 13.99, 10),
  ('Grey Goose', 12.99, 12),
  ('Tito''s Handmade', 10.99, 24),
  ('Belvedere', 12.99, 10),
  ('Ketel One', 11.99, 15),
  ('Absolut', 9.99, 24),
  ('Stolichnaya', 9.99, 18),
  ('Smirnoff', 8.99, 30),
  ('Ciroc', 13.99, 10),
  ('Chopin', 12.99, 8),
  ('Bacardi White', 8.99, 24),
  ('Captain Morgan', 9.99, 20),
  ('Malibu Coconut', 9.99, 18),
  ('Havana Club', 11.99, 12),
  ('Mount Gay', 11.99, 10),
  ('Appleton Estate', 12.99, 8),
  ('Ron Zacapa', 15.99, 6),
  ('Diplomatico', 14.99, 6),
  ('Kraken Black', 10.99, 15),
  ('Patron Silver', 13.99, 10),
  ('Don Julio Blanco', 14.99, 8),
  ('Casamigos Blanco', 14.99, 8),
  ('Herradura Silver', 12.99, 10),
  ('Jose Cuervo Gold', 8.99, 24),
  ('Espolon Blanco', 10.99, 15),
  ('1800 Silver', 11.99, 12),
  ('Clase Azul Reposado', 29.99, 4),
  ('Fortaleza Blanco', 16.99, 6)
) AS v(name, price, stock)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.name = v.name AND p.category_id = '01369c9c-80a1-4890-b2b3-f4056e47804a'::uuid
);

-- Also add more Mocktails products with inventory
INSERT INTO products (name, price, category_id, inventory_tracking, stock_count, is_available, active, archived)
SELECT v.name, v.price, '00713c73-6055-437c-9735-182b496345dc'::uuid, true, v.stock, true, true, false
FROM (VALUES
  ('Virgin Colada', 7.99, 18),
  ('Fruit Punch', 5.99, 24),
  ('Lemon Fizz', 5.49, 30),
  ('Berry Blast', 6.99, 20),
  ('Arnold Palmer Mocktail', 5.99, 24),
  ('Virgin Mary', 7.49, 15),
  ('Sunrise', 6.99, 18),
  ('Sunset', 6.99, 18),
  ('Cooler', 5.99, 24)
) AS v(name, price, stock)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.name = v.name AND p.category_id = '00713c73-6055-437c-9735-182b496345dc'::uuid
);
