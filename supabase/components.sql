-- Wattouna Global Component Database (IoT expansion).
-- Run inside supabase-db:
--   cat supabase/components.sql | docker exec -i supabase-db psql -U postgres -v ON_ERROR_STOP=1
-- All datasheet_url values were HTTP-verified (200) at seed time, 2026-09.

create table if not exists public.hardware_components (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null check (category in ('MCU', 'Sensor', 'Display', 'Power', 'Logic')),
  operating_voltage text not null default '',
  description text not null default '',
  resources jsonb not null default '{"sourcing": []}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists hwcomp_cat_idx on public.hardware_components (category);
create index if not exists hwcomp_slug_idx on public.hardware_components (slug);

alter table public.hardware_components enable row level security;
drop policy if exists "hwcomp public read" on public.hardware_components;
create policy "hwcomp public read" on public.hardware_components for select using (true);

-- ---------------------------------------------------------- seed data
insert into public.hardware_components (slug, name, category, operating_voltage, description, resources) values
('esp32-devkit-v1', 'ESP32 DevKit V1 (30-pin)', 'MCU', '5V in / 3.3V logic',
 'Dual-core WiFi+BT MCU, brain of IoT nodes. GPIOs are 3.3V ONLY — never feed 5V/12V/36V into pins. I2C default SDA=GPIO21, SCL=GPIO22.',
 '{"datasheet_url": "https://documentation.espressif.com/esp32-wroom-32_datasheet_en.pdf", "high_res_image": null,
   "sourcing": [{"vendor": "Rue d\u2019Athènes (Tunis)", "url": "https://www.google.com/maps/search/magasin+composants+electroniques+Tunis", "price_est": "~35-55 TND"},
                {"vendor": "AliExpress", "url": "https://www.aliexpress.com/wholesale?SearchText=ESP32+DevKit", "price_est": "~$6-9"},
                {"vendor": "Gotronic", "url": "https://www.gotronic.fr", "price_est": "~12-15 €"}]}'),
('oled-096-i2c', '0.96" OLED I2C Display (SSD1306)', 'Display', '3.3-5V',
 '128x64 pixels, I2C address 0x3C. SDA→SDA, SCL→SCL (never crossed). Glows cyan when simulated.',
 '{"datasheet_url": "https://cdn-shop.adafruit.com/datasheets/SSD1306.pdf", "high_res_image": null,
   "sourcing": [{"vendor": "Rue d\u2019Athènes (Tunis)", "url": "https://www.google.com/maps/search/magasin+composants+electroniques+Tunis", "price_est": "~15-25 TND"},
                {"vendor": "AliExpress", "url": "https://www.aliexpress.com/wholesale?SearchText=0.96+inch+OLED+I2C", "price_est": "~$3-5"}]}'),
('bme280-env', 'BME280 Environment Sensor', 'Sensor', '3.3V ONLY',
 'Temperature + humidity + pressure over I2C (0x76/0x77). Strictly 3.3V — 5V kills it. Share the bus with the OLED.',
 '{"datasheet_url": "https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bme280-ds002.pdf", "high_res_image": null,
   "sourcing": [{"vendor": "AliExpress", "url": "https://www.aliexpress.com/wholesale?SearchText=BME280", "price_est": "~$2-4"},
                {"vendor": "Gotronic", "url": "https://www.gotronic.fr", "price_est": "~8-12 €"}]}'),
('dht22-am2302', 'DHT22 / AM2302 Temp+Humidity', 'Sensor', '3.3-5V',
 'Single-wire digital sensor, simpler than BME280 but slower. Good first sensor for smart thermometers.',
 '{"datasheet_url": "https://cdn.sparkfun.com/assets/f/7/d/9/c/DHT22.pdf", "high_res_image": null,
   "sourcing": [{"vendor": "Sousse Trocadéro", "url": "https://www.google.com/maps/search/magasin+composants+electroniques+Sousse", "price_est": "~12-20 TND"},
                {"vendor": "AliExpress", "url": "https://www.aliexpress.com/wholesale?SearchText=DHT22", "price_est": "~$2-3"}]}'),
('ltc3780-mppt', 'LTC3780 MPPT Boost Module', 'Power', '18-36V in / 42V out',
 'Buck-boost solar charger for 10S packs. Pre-set output to 42.0V unloaded. Up to 160W at ~90%.',
 '{"datasheet_url": null, "high_res_image": null,
   "sourcing": [{"vendor": "Charguia (Tunis)", "url": "https://www.google.com/maps/search/magasin+composants+electroniques+Tunis", "price_est": "~35-50 TND"},
                {"vendor": "AliExpress", "url": "https://www.aliexpress.com/wholesale?SearchText=LTC3780", "price_est": "~$10-14"}]}'),
('irf4905-pmos', 'IRF4905 P-MOSFET + TL431 Latch', 'Power', '36V rail',
 'Zero-quiescent solid-state switch: TL431 (Vref 2.495V, R1 82k/RV1 20k/R2 8.2k) trips at 31.00V, MOSFET isolates load to 0.00mA.',
 '{"datasheet_url": "https://www.infineon.com/dgdl/irf4905.pdf", "high_res_image": null,
   "sourcing": [{"vendor": "Rue d\u2019Athènes (Tunis)", "url": "https://www.google.com/maps/search/magasin+composants+electroniques+Tunis", "price_est": "~4-8 TND"},
                {"vendor": "Mouser", "url": "https://www.mouser.com/c/?q=IRF4905", "price_est": "~$2-3"}]}'),
('tl431-ref', 'TL431 Shunt Reference', 'Logic', '2.495V ref',
 'Programmable precision reference setting the 31.00V cutoff with R1/RV1/R2. Hysteresis via Rhys 2.2M (0.45V window).',
 '{"datasheet_url": "https://www.ti.com/lit/ds/symlink/tl431.pdf", "high_res_image": null,
   "sourcing": [{"vendor": "Rue d\u2019Athènes (Tunis)", "url": "https://www.google.com/maps/search/magasin+composants+electroniques+Tunis", "price_est": "~1-2 TND"}]}'),
('wago-221-413', 'WAGO 221-413/415 Lever Nuts', 'Logic', '450V / 32A max',
 'Transparent lever connectors: the solderless backbone of every PBX build. Reusable hundreds of times.',
 '{"datasheet_url": null, "high_res_image": null,
   "sourcing": [{"vendor": "Charguia (Tunis)", "url": "https://www.google.com/maps/search/magasin+composants+electroniques+Tunis", "price_est": "~1.5 TND/pc"},
                {"vendor": "Reichelt", "url": "https://www.reichelt.com", "price_est": "~€0.60/pc"}]}'),
('ip2368-pd', 'IP2368 USB-C PD Module', 'Power', 'bus in / 100W PD out',
 '100W Power-Delivery + 18W QC for laptops and phones, fed from the orange latched bus.',
 '{"datasheet_url": null, "high_res_image": null,
   "sourcing": [{"vendor": "AliExpress", "url": "https://www.aliexpress.com/wholesale?SearchText=IP2368+PD", "price_est": "~$7-10"}]}'),
('pack-10s-liion', 'Recycled 10S Li-ion Pack (36V)', 'Power', '36V nom / 42V full',
 'Upcycled e-scooter pack, 336Wh usable. Reject cells under 3.0V or swollen. Never bypass BMS or 15A fuse.',
 '{"datasheet_url": null, "high_res_image": null,
   "sourcing": [{"vendor": "Moncef Bey (Tunis)", "url": "https://www.google.com/maps/search/batterie+trottinette+Tunis", "price_est": "~80-150 TND used"}]}')
on conflict (slug) do update set
  name = excluded.name, category = excluded.category,
  operating_voltage = excluded.operating_voltage,
  description = excluded.description, resources = excluded.resources;
