--
-- File: seed_data.sql
-- Description: ข้อมูลเริ่มต้นสำหรับตาราง tables และ menu_items เผื่อคำสั่ง migration ใน dockercomposefile มีปัญหา
-- ใช้สำหรับ Seed Data หลังจากการ Migration เสร็จสิ้น
--

-- 1. ข้อมูลสำหรับตาราง "tables" (9 โต๊ะ)
--------------------------------------------------
INSERT INTO "tables" ("number", "status") VALUES
(1, 'AVAILABLE'),
(2, 'AVAILABLE'),
(3, 'AVAILABLE'),
(4, 'AVAILABLE'),
(5, 'AVAILABLE'),
(6, 'AVAILABLE'),
(7, 'AVAILABLE'),
(8, 'AVAILABLE'),
(9, 'AVAILABLE')
ON CONFLICT ("number") DO UPDATE SET "status" = EXCLUDED.status;


-- 2. ข้อมูลสำหรับตาราง "menu_items"
--------------------------------------------------
INSERT INTO "menu_items" (
    "name", 
    "description", 
    "price", 
    "is_signature", 
    "category", 
    "image_url",
    "is_available" 
) VALUES
(
    'Ebi Fry Katsu Curry Rice',
    'Rich and flavorful Japanese Curry served over soft, fluffy Japanese rice. Topped with large Ebi Fry.',
    289.00,
    FALSE,
    'rice',
    'https://ik.imagekit.io/496kiwiBird/261497project/menu1.png?updatedAt=1759220941089',
    TRUE
),
(
    'Enso''s Secret Beef Ramen', 
    'A luxurious bowl featuring marinated beef, soft-boiled egg, and rich broth.',
    159.00,
    TRUE,
    'noodle',
    'https://ik.imagekit.io/496kiwiBird/261497project/signature.png?updatedAt=1759220936892',
    TRUE
),
(
    'Kuro Mayu Chashu Ramen',
    'The ultimate rich ramen experience. A creamy, robust pork broth bowl infused with smoky-sweet black garlic oil.',
    169.00,
    FALSE,
    'noodle',
    'https://ik.imagekit.io/496kiwiBird/261497project/menu2.png?updatedAt=1759220940713',
    TRUE
),
(
    'Mushroom & Soba Clarity',
    'A clear dashi broth paired with soba noodles, featuring an abundance of small, earthy mushrooms and a garnish of microgreens.',
    156.00,
    FALSE,
    'noodle',
    'https://ik.imagekit.io/496kiwiBird/261497project/Mask%20group%20(4).png?updatedAt=1759384870088',
    TRUE
),
(
    'Spicy Chicken Soboro Ramen',
    'A savory and rich broth served with springy ramen noodles, topped with seasoned spicy ground chicke and sweet corn.',
    201.00,
    FALSE,
    'noodle',
    'https://ik.imagekit.io/496kiwiBird/261497project/menu3.png?updatedAt=1759220940332',
    TRUE
),
(
    'The Harvest Bowl',
    'A vibrant and filling noodle dish that balances heat and sweetness. Features fresh corn kernels.',
    149.00,
    FALSE,
    'noodle',
    'https://ik.imagekit.io/496kiwiBird/261497project/Mask%20group%20(3).png?updatedAt=1759384859238',
    TRUE
),
(
    'Katsu curry',
    'A classic, comforting dish featuring tender beef chunks, slow-cooked with carrots and onions.',
    149.00,
    FALSE,
    'rice',
    'https://ik.imagekit.io/496kiwiBird/261497project/menu6.png?updatedAt=1759410727451',
    TRUE
),
(
    'Kyoza',
    'Crispy pork Gyoza.',
    159.00,
    FALSE,
    'appetizer',
    'https://ik.imagekit.io/496kiwiBird/261497project/kyoza.PNG?updatedAt=1760404585768',
    TRUE
);