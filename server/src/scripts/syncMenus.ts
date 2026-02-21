import { pool } from '../config/database.js';

// Definiciones de tipos y datos copiados de menuConfig.ts para evitar problemas de importación
enum Role {
  Administrador = 'Administrador',
  GerenteEstacion = 'GerenteEstacion',
  GerenteZona = 'GerenteZona',
  Direccion = 'Direccion',
}

type MenuItemType = 'route' | 'view';

interface MenuItem {
  id: string;
  type: MenuItemType;
  path?: string;
  viewId?: string;
  label: string;
  icon: string;
  roles: Role[];
  requiresExactMatch?: boolean;
}

const menuConfig: MenuItem[] = [
  // Admin routes
  {
    id: 'admin-resumen',
    type: 'route',
    path: '/admin',
    label: 'Resumen',
    icon: 'dashboard',
    roles: [Role.Administrador],
    requiresExactMatch: true,
  },
  {
    id: 'admin-usuarios',
    type: 'route',
    path: '/admin/usuarios',
    label: 'Usuarios',
    icon: 'people',
    roles: [Role.Administrador],
  },
  {
    id: 'admin-reportes',
    type: 'route',
    path: '/admin/reportes',
    label: 'Reportes',
    icon: 'description',
    roles: [Role.Administrador],
  },
  {
    id: 'admin-logs',
    type: 'route',
    path: '/admin/logs',
    label: 'Logs',
    icon: 'history',
    roles: [Role.Administrador],
  },
  {
    id: 'admin-zonas',
    type: 'route',
    path: '/admin/zonas-estaciones',
    label: 'Zonas',
    icon: 'location_on',
    roles: [Role.Administrador],
  },
  {
    id: 'admin-configuracion',
    type: 'route',
    path: '/admin/configuracion',
    label: 'Configuración',
    icon: 'settings',
    roles: [Role.Administrador],
  },
  {
    id: 'admin-productos',
    type: 'route',
    path: '/admin/productos',
    label: 'Productos',
    icon: 'inventory_2',
    roles: [Role.Administrador],
  },
  {
    id: 'reporte-eficiencia',
    type: 'route',
    path: '/reporte-eficiencia',
    label: 'Eficiencia',
    icon: 'monitoring',
    roles: [Role.Administrador, Role.GerenteEstacion, Role.GerenteZona, Role.Direccion],
  },
  {
    id: 'reporte-vtas',
    type: 'route',
    path: '/reporte-vtas',
    label: 'Vtas',
    icon: 'bar_chart',
    roles: [Role.Administrador, Role.GerenteEstacion, Role.GerenteZona, Role.Direccion],
  },
  {
    id: 'revision-mensual',
    type: 'route',
    path: '/revision-mensual',
    label: 'Revisión Mensual',
    icon: 'fact_check',
    roles: [Role.GerenteEstacion],
  },
  {
    id: 'dashboard-financiero',
    type: 'route',
    path: '/dashboard-financiero',
    label: 'Control Financiero',
    icon: 'account_balance',
    roles: [Role.GerenteEstacion, Role.GerenteZona, Role.Direccion, Role.Administrador],
  },
  // GerenteEstacion views
  {
    id: 'gerente-estacion-dashboard',
    type: 'view',
    viewId: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    roles: [Role.GerenteEstacion],
  },
  {
    id: 'gerente-estacion-reportes',
    type: 'view',
    viewId: 'reportes',
    label: 'Mis Reportes',
    icon: 'description',
    roles: [Role.GerenteEstacion],
  },
  {
    id: 'gerente-estacion-nueva-captura',
    type: 'view',
    viewId: 'nuevaCaptura',
    label: 'Nueva Captura',
    icon: 'add',
    roles: [Role.GerenteEstacion],
  },
  {
    id: 'gerente-estacion-historial',
    type: 'view',
    viewId: 'historial',
    label: 'Historial',
    icon: 'history',
    roles: [Role.GerenteEstacion],
  },
  // GerenteZona views
  {
    id: 'gerente-zona-dashboard',
    type: 'view',
    viewId: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    roles: [Role.GerenteZona],
  },
  {
    id: 'gerente-zona-revision',
    type: 'view',
    viewId: 'revision',
    label: 'Revisión',
    icon: 'task_alt',
    roles: [Role.GerenteZona],
  },
  {
    id: 'gerente-zona-historial',
    type: 'view',
    viewId: 'historial',
    label: 'Historial',
    icon: 'history',
    roles: [Role.GerenteZona],
  },
  // Director views
  {
    id: 'director-resumen',
    type: 'view',
    viewId: 'resumen',
    label: 'Resumen',
    icon: 'dashboard',
    roles: [Role.Direccion],
  },
  {
    id: 'director-reportes',
    type: 'route',
    path: '/director/reportes',
    label: 'Reportes',
    icon: 'description',
    roles: [Role.Direccion],
  },
  {
    id: 'director-liquidaciones',
    type: 'route',
    path: '/director/liquidaciones',
    label: 'Liquidaciones',
    icon: 'request_quote',
    roles: [Role.Direccion],
  },
];

async function syncMenus() {
  const client = await pool.connect();
  try {
    console.log('Iniciando sincronización de menús...');
    
    // Obtener roles para mapear IDs
    const rolesRes = await client.query('SELECT id, codigo FROM roles');
    const rolesMap = new Map(rolesRes.rows.map(r => [r.codigo, r.id]));
    
    await client.query('BEGIN');

    // 1. Limpiar menús existentes
    await client.query('DELETE FROM menu_roles');
    await client.query('DELETE FROM menus');

    // 2. Insertar menús desde menuConfig
    for (const item of menuConfig) {
      const isRoute = item.type === 'route';
      
      // Obtener el ID del menú insertado para usarlo en menu_roles
      const res = await client.query(
        `INSERT INTO menus (menu_id, label, icon, tipo, path, view_id, orden, activo, requiere_exact_match)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          item.id, // menu_id
          item.label,
          item.icon,
          item.type, // tipo
          isRoute ? item.path : null,
          !isRoute ? item.viewId : null,
          0,
          true, // activo
          item.requiresExactMatch || false
        ]
      );
      
      const menuUuid = res.rows[0].id;

      for (const roleCode of item.roles) {
        const roleId = rolesMap.get(roleCode);
        if (!roleId) {
          console.warn(`⚠️ Rol no encontrado en BD: ${roleCode}`);
          continue;
        }

        await client.query(
          `INSERT INTO menu_roles (menu_id, role, role_id)
           VALUES ($1, $2, $3)`,
          [menuUuid, roleCode, roleId]
        );
      }
    }

    await client.query('COMMIT');
    console.log('✅ Menús sincronizados correctamente');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error al sincronizar menús:', error);
  } finally {
    client.release();
    process.exit();
  }
}

syncMenus();
