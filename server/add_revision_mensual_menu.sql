-- Insertar el menú "Revisión Mensual"
INSERT INTO menus (menu_id, tipo, path, view_id, label, icon, orden, requiere_exact_match, activo)
VALUES ('revision-mensual', 'route', '/revision-mensual', NULL, 'Revisión Mensual', 'fact_check', 22, false, true)
ON CONFLICT (menu_id) DO NOTHING;

-- Asignar el rol GerenteEstacion al menú
INSERT INTO menu_roles (menu_id, role_id, role)
SELECT m.id, r.id, r.codigo
FROM menus m, roles r
WHERE m.menu_id = 'revision-mensual' AND r.codigo = 'GerenteEstacion'
ON CONFLICT (menu_id, role_id) DO NOTHING;

-- Verificar que se insertó correctamente
SELECT 
  m.menu_id,
  m.tipo,
  m.label,
  m.path,
  m.icon,
  array_agg(mr.role) as roles
FROM menus m
LEFT JOIN menu_roles mr ON m.id = mr.menu_id
WHERE m.menu_id = 'revision-mensual'
GROUP BY m.id, m.menu_id, m.tipo, m.label, m.path, m.icon;
