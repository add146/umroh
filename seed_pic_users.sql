-- PIC: Laras (Paket Umroh & Jadwal Keberangkatan (Export/Import Google Sheet/Excel))
INSERT INTO users (id, email, password, name, phone, role, is_active) VALUES ('usr-pic-laras', 'laras@almadinahms.com', 'cf4b787a76dca21ef5c89deaf7c8170e:3636a710432182667a83a45c4db743583ca5bd4bdafa43d882d802a99982ade4', 'Laras', '08123456701', 'pusat', 1) ON CONFLICT(id) DO UPDATE SET email=excluded.email, password=excluded.password, name=excluded.name, phone=excluded.phone, role=excluded.role, is_active=1;
INSERT OR IGNORE INTO hierarchy_paths (ancestor_id, descendant_id, path_length) VALUES ('usr-pic-laras', 'usr-pic-laras', 0);

-- PIC: Ega (Logistik & Inventory (Checklist & Catatan Kaki Penerima))
INSERT INTO users (id, email, password, name, phone, role, is_active) VALUES ('usr-pic-ega', 'ega@almadinahms.com', 'e35feed802752be16cb0416d78514670:c54d79dacecc6c00b55974b086d7061b9ea7766936fc978839026fc60155d578', 'Ega', '08123456702', 'teknisi', 1) ON CONFLICT(id) DO UPDATE SET email=excluded.email, password=excluded.password, name=excluded.name, phone=excluded.phone, role=excluded.role, is_active=1;
INSERT OR IGNORE INTO hierarchy_paths (ancestor_id, descendant_id, path_length) VALUES ('usr-pic-ega', 'usr-pic-ega', 0);

-- PIC: Adin (Data Jamaah, Manifest, Rooming Board (Gender & Room Type))
INSERT INTO users (id, email, password, name, phone, role, is_active) VALUES ('usr-pic-adin', 'adin@almadinahms.com', 'cbf93b1d3cd59cbb285876502aa3fb65:dec6b2234c0684d0b8dca419e82014872912e41e61f4c79fbbd01f48bd90290e', 'Adin', '08123456703', 'pusat', 1) ON CONFLICT(id) DO UPDATE SET email=excluded.email, password=excluded.password, name=excluded.name, phone=excluded.phone, role=excluded.role, is_active=1;
INSERT OR IGNORE INTO hierarchy_paths (ancestor_id, descendant_id, path_length) VALUES ('usr-pic-adin', 'usr-pic-adin', 0);

-- PIC: Edrea (Data Jamaah, Manifest, Rooming Board (Gender & Room Type))
INSERT INTO users (id, email, password, name, phone, role, is_active) VALUES ('usr-pic-edrea', 'edrea@almadinahms.com', '41be5dc24ed531c68969e682559cf038:d895eb58bdf7b9a5cf358cdb54558f4624ceb28230651a344f0a36aff0761930', 'Edrea', '08123456704', 'pusat', 1) ON CONFLICT(id) DO UPDATE SET email=excluded.email, password=excluded.password, name=excluded.name, phone=excluded.phone, role=excluded.role, is_active=1;
INSERT OR IGNORE INTO hierarchy_paths (ancestor_id, descendant_id, path_length) VALUES ('usr-pic-edrea', 'usr-pic-edrea', 0);
