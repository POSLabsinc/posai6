
-- Archive duplicate products with non-matching names
UPDATE products SET archived = true WHERE name = 'Grey Goose Vodka' AND category_id = '01369c9c-80a1-4890-b2b3-f4056e47804a';
UPDATE products SET archived = true WHERE name = 'Patrón Silver' AND category_id = '01369c9c-80a1-4890-b2b3-f4056e47804a';
UPDATE products SET archived = true WHERE name = 'Macallan 12' AND category_id = '01369c9c-80a1-4890-b2b3-f4056e47804a';
-- Also archive old Drinks duplicates
UPDATE products SET archived = true WHERE name = 'Mineral Water' AND category_id = '6db3c05f-5fb7-487f-affb-c4b9652ea946';
UPDATE products SET archived = true WHERE name = 'Ginger Beer' AND category_id = '6db3c05f-5fb7-487f-affb-c4b9652ea946';
