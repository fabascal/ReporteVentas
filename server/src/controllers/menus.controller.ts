import { Request, Response } from 'express'
import { pool } from '../config/database.js'
import { Role } from '../types/auth.js'

const isValidMenuId = (value: string) => /^[a-z0-9-]+$/.test(value)
const isValidViewId = (value: string) => /^[a-zA-Z0-9_-]+$/.test(value)

export const menusController = {
  // Obtener todos los menús
  async getMenus(req: Request, res: Response) {
    try {
      const result = await pool.query(`
        SELECT 
          m.*,
          COALESCE(
            json_agg(DISTINCT r.codigo) FILTER (WHERE r.codigo IS NOT NULL),
            '[]'::json
          ) as roles
        FROM menus m
        LEFT JOIN menu_roles mr ON m.id = mr.menu_id
        LEFT JOIN roles r ON mr.role_id = r.id
        WHERE m.activo = true
        GROUP BY m.id
        ORDER BY m.orden ASC, m.label ASC
      `)

      // Transformar roles de array JSON a array de strings y mapear nombres de columnas
      const menus = result.rows.map((menu) => ({
        id: menu.id,
        menu_id: menu.menu_id,
        type: menu.tipo, // Mapear tipo -> type
        path: menu.path,
        view_id: menu.view_id,
        label: menu.label,
        icon: menu.icon,
        orden: menu.orden,
        requiere_exact_match: menu.requiere_exact_match,
        activo: menu.activo,
        roles: menu.roles || [],
        created_at: menu.created_at,
        updated_at: menu.updated_at,
      }))

      res.json(menus)
    } catch (error) {
      console.error('Error al obtener menús:', error)
      res.status(500).json({ error: 'Error al obtener menús' })
    }
  },

  // Obtener menús por rol
  async getMenusByRole(req: Request, res: Response) {
    try {
      const { role } = req.params

      // Primero obtener el role_id desde el código del rol
      const roleResult = await pool.query(
        `SELECT id FROM roles WHERE codigo = $1 AND activo = true`,
        [role]
      )

      if (roleResult.rows.length === 0) {
        return res.json([])
      }

      const roleId = roleResult.rows[0].id

      // Obtener los menús que tienen este rol usando role_id
      const menusResult = await pool.query(
        `
        SELECT DISTINCT
          m.id,
          m.orden,
          m.label
        FROM menus m
        INNER JOIN menu_roles mr ON m.id = mr.menu_id
        WHERE m.activo = true AND mr.role_id = $1
        ORDER BY m.orden ASC, m.label ASC
      `,
        [roleId]
      )

      // Luego obtener los menús completos con sus roles
      const menuIds = menusResult.rows.map((row) => row.id)
      
      if (menuIds.length === 0) {
        return res.json([])
      }

      const result = await pool.query(
        `
        SELECT 
          m.*,
          COALESCE(
            json_agg(DISTINCT r.codigo) FILTER (WHERE r.codigo IS NOT NULL),
            '[]'::json
          ) as roles
        FROM menus m
        LEFT JOIN menu_roles mr ON m.id = mr.menu_id
        LEFT JOIN roles r ON mr.role_id = r.id
        WHERE m.id = ANY($1::uuid[]) AND m.activo = true
        GROUP BY m.id
        ORDER BY m.orden ASC, m.label ASC
      `,
        [menuIds]
      )

      // Transformar roles de array JSON a array de strings y mapear nombres de columnas
      const menus = result.rows.map((menu) => ({
        id: menu.id,
        menu_id: menu.menu_id,
        type: menu.tipo, // Mapear tipo -> type
        path: menu.path,
        view_id: menu.view_id,
        label: menu.label,
        icon: menu.icon,
        orden: menu.orden,
        requiere_exact_match: menu.requiere_exact_match,
        activo: menu.activo,
        roles: menu.roles || [],
        created_at: menu.created_at,
        updated_at: menu.updated_at,
      }))

      res.json(menus)
    } catch (error) {
      console.error('Error al obtener menús por rol:', error)
      res.status(500).json({ error: 'Error al obtener menús por rol' })
    }
  },

  // Obtener un menú por ID
  async getMenuById(req: Request, res: Response) {
    try {
      const { id } = req.params

      const menuResult = await pool.query('SELECT * FROM menus WHERE id = $1', [id])

      if (menuResult.rows.length === 0) {
        return res.status(404).json({ error: 'Menú no encontrado' })
      }

      const rolesResult = await pool.query(
        'SELECT role FROM menu_roles WHERE menu_id = $1',
        [id]
      )

      const menuRow = menuResult.rows[0]
      const menu = {
        id: menuRow.id,
        menu_id: menuRow.menu_id,
        type: menuRow.tipo, // Mapear tipo -> type
        path: menuRow.path,
        view_id: menuRow.view_id,
        label: menuRow.label,
        icon: menuRow.icon,
        orden: menuRow.orden,
        requiere_exact_match: menuRow.requiere_exact_match,
        activo: menuRow.activo,
        roles: rolesResult.rows.map((r) => r.role),
        created_at: menuRow.created_at,
        updated_at: menuRow.updated_at,
      }

      res.json(menu)
    } catch (error) {
      console.error('Error al obtener menú:', error)
      res.status(500).json({ error: 'Error al obtener menú' })
    }
  },

  // Crear un nuevo menú
  async createMenu(req: Request, res: Response) {
    try {
      const { menu_id, tipo, path, view_id, label, icon, orden, requiere_exact_match, roles } =
        req.body

      // Validaciones
      if (!menu_id || !tipo || !label || !icon) {
        return res.status(400).json({ error: 'Faltan campos requeridos: menu_id, tipo, label, icon' })
      }
      if (!isValidMenuId(menu_id)) {
        return res.status(400).json({ error: 'menu_id inválido. Use solo minúsculas, números y guiones.' })
      }

      if (tipo === 'route' && !path) {
        return res.status(400).json({ error: 'El tipo "route" requiere un campo "path" (ruta de navegación)' })
      }

      if (tipo === 'view' && !view_id) {
        return res.status(400).json({ error: 'El tipo "view" requiere un campo "view_id" (identificador de vista interna)' })
      }

      // Validar que no se mezclen campos
      if (tipo === 'route' && view_id) {
        return res.status(400).json({ error: 'El tipo "route" no debe tener un "view_id". Use "path" en su lugar.' })
      }

      if (tipo === 'view' && path) {
        return res.status(400).json({ error: 'El tipo "view" no debe tener un "path". Use "view_id" en su lugar.' })
      }
      if (tipo === 'route' && path && !path.startsWith('/')) {
        return res.status(400).json({ error: 'El path debe iniciar con "/" (ej: /admin/reportes)' })
      }
      if (tipo === 'view' && view_id && !isValidViewId(view_id)) {
        return res.status(400).json({ error: 'view_id inválido. Use letras, números, guion o guion bajo.' })
      }

      if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({ error: 'Debe asignar al menos un rol' })
      }

      // Iniciar transacción
      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        // Insertar menú
        const menuResult = await client.query(
          `
          INSERT INTO menus (menu_id, tipo, path, view_id, label, icon, orden, requiere_exact_match)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `,
          [menu_id, tipo, path || null, view_id || null, label, icon, orden || 0, requiere_exact_match || false]
        )

        const menu = menuResult.rows[0]

        // Insertar roles usando role_id
        for (const roleCodigo of roles) {
          // Obtener el role_id desde el código del rol
          const roleResult = await client.query(
            'SELECT id, codigo FROM roles WHERE codigo = $1 AND activo = true',
            [roleCodigo]
          )
          
          if (roleResult.rows.length > 0) {
            const roleId = roleResult.rows[0].id
            const roleCodigoValue = roleResult.rows[0].codigo
            await client.query(
              'INSERT INTO menu_roles (menu_id, role_id, role) VALUES ($1, $2, $3)',
              [menu.id, roleId, roleCodigoValue]
            )
          }
        }

        await client.query('COMMIT')

        // Obtener el menú completo con roles
        const rolesResult = await client.query(
          `SELECT r.codigo as role 
           FROM menu_roles mr
           JOIN roles r ON mr.role_id = r.id
           WHERE mr.menu_id = $1`,
          [menu.id]
        )

        const menuCompleto = {
          id: menu.id,
          menu_id: menu.menu_id,
          type: menu.tipo, // Mapear tipo -> type
          path: menu.path,
          view_id: menu.view_id,
          label: menu.label,
          icon: menu.icon,
          orden: menu.orden,
          requiere_exact_match: menu.requiere_exact_match,
          activo: menu.activo,
          roles: rolesResult.rows.map((r) => r.role),
          created_at: menu.created_at,
          updated_at: menu.updated_at,
        }

        res.status(201).json(menuCompleto)
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    } catch (error: any) {
      console.error('Error al crear menú:', error)
      if (error.code === '23505') {
        // Violación de unique constraint
        return res.status(400).json({ error: 'El menu_id ya existe' })
      }
      res.status(500).json({ error: 'Error al crear menú' })
    }
  },

  // Actualizar un menú
  async updateMenu(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { menu_id, tipo, path, view_id, label, icon, orden, requiere_exact_match, roles, activo } =
        req.body

      // Obtener el menú actual para validaciones
      const menuActual = await pool.query('SELECT tipo, path, view_id FROM menus WHERE id = $1', [id])
      
      if (menuActual.rows.length === 0) {
        return res.status(404).json({ error: 'Menú no encontrado' })
      }

      const tipoActual = menuActual.rows[0].tipo
      const tipoNuevo = tipo || tipoActual

      if (menu_id && !isValidMenuId(menu_id)) {
        return res.status(400).json({ error: 'menu_id inválido. Use solo minúsculas, números y guiones.' })
      }

      // Validaciones solo si se está cambiando el tipo
      if (tipo && tipo !== tipoActual) {
        // Se está cambiando el tipo
        if (tipo === 'route' && !path) {
          return res.status(400).json({ error: 'El tipo "route" requiere un campo "path" (ruta de navegación)' })
        }
        if (tipo === 'view' && !view_id) {
          return res.status(400).json({ error: 'El tipo "view" requiere un campo "view_id" (identificador de vista interna)' })
        }
      }

      // Validaciones para el tipo actual (o nuevo si se está cambiando)
      if (tipoNuevo === 'route') {
        // No debe tener view_id si es route
        if (view_id !== undefined && view_id !== null) {
          return res.status(400).json({ error: 'El tipo "route" no debe tener un "view_id". Use "path" en su lugar.' })
        }
        if (path && !path.startsWith('/')) {
          return res.status(400).json({ error: 'El path debe iniciar con "/" (ej: /admin/reportes)' })
        }
      }

      if (tipoNuevo === 'view') {
        // No debe tener path si es view (solo validar si se está enviando explícitamente)
        // Permitir path como null o undefined si solo se están actualizando los roles
        if (path !== undefined && path !== null && path !== '') {
          return res.status(400).json({ error: 'El tipo "view" no debe tener un "path". Use "view_id" en su lugar.' })
        }
        if (view_id && !isValidViewId(view_id)) {
          return res.status(400).json({ error: 'view_id inválido. Use letras, números, guion o guion bajo.' })
        }
      }

      if (roles && (!Array.isArray(roles) || roles.length === 0)) {
        return res.status(400).json({ error: 'Debe asignar al menos un rol' })
      }

      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        // Actualizar menú
        const updateFields: string[] = []
        const updateValues: any[] = []
        let paramCount = 1

        if (menu_id !== undefined) {
          updateFields.push(`menu_id = $${paramCount++}`)
          updateValues.push(menu_id)
        }
        if (tipo !== undefined) {
          updateFields.push(`tipo = $${paramCount++}`)
          updateValues.push(tipo)
        }
        if (path !== undefined) {
          // Solo actualizar path si el tipo es 'route' o si se está cambiando a 'route'
          if (tipoNuevo === 'route') {
            updateFields.push(`path = $${paramCount++}`)
            updateValues.push(path)
          } else if (tipo === 'route') {
            // Si se está cambiando de 'route' a 'view', limpiar el path
            updateFields.push(`path = $${paramCount++}`)
            updateValues.push(null)
          }
        }
        if (view_id !== undefined) {
          // Solo actualizar view_id si el tipo es 'view' o si se está cambiando a 'view'
          if (tipoNuevo === 'view') {
            updateFields.push(`view_id = $${paramCount++}`)
            updateValues.push(view_id)
          } else if (tipo === 'view') {
            // Si se está cambiando de 'view' a 'route', limpiar el view_id
            updateFields.push(`view_id = $${paramCount++}`)
            updateValues.push(null)
          }
        }
        if (label !== undefined) {
          updateFields.push(`label = $${paramCount++}`)
          updateValues.push(label)
        }
        if (icon !== undefined) {
          updateFields.push(`icon = $${paramCount++}`)
          updateValues.push(icon)
        }
        if (orden !== undefined) {
          updateFields.push(`orden = $${paramCount++}`)
          updateValues.push(orden)
        }
        if (requiere_exact_match !== undefined) {
          updateFields.push(`requiere_exact_match = $${paramCount++}`)
          updateValues.push(requiere_exact_match)
        }
        if (activo !== undefined) {
          updateFields.push(`activo = $${paramCount++}`)
          updateValues.push(activo)
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

        if (updateFields.length > 1) {
          updateValues.push(id)
          const query = `UPDATE menus SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`
          await client.query(query, updateValues)
        }

        // Actualizar roles si se proporcionan
        if (roles) {
          // Eliminar roles existentes
          await client.query('DELETE FROM menu_roles WHERE menu_id = $1', [id])

          // Insertar nuevos roles usando role_id
          for (const roleCodigo of roles) {
            // Obtener el role_id desde el código del rol
            const roleResult = await client.query(
              'SELECT id, codigo FROM roles WHERE codigo = $1 AND activo = true',
              [roleCodigo]
            )
            
            if (roleResult.rows.length > 0) {
              const roleId = roleResult.rows[0].id
              const roleCodigoValue = roleResult.rows[0].codigo
              await client.query(
                'INSERT INTO menu_roles (menu_id, role_id, role) VALUES ($1, $2, $3)',
                [id, roleId, roleCodigoValue]
              )
            }
          }
        }

        await client.query('COMMIT')

        // Obtener el menú actualizado
        const menuResult = await client.query('SELECT * FROM menus WHERE id = $1', [id])
        const rolesResult = await client.query(
          `SELECT r.codigo as role 
           FROM menu_roles mr
           JOIN roles r ON mr.role_id = r.id
           WHERE mr.menu_id = $1`,
          [id]
        )

        const menuRow = menuResult.rows[0]
        const menu = {
          id: menuRow.id,
          menu_id: menuRow.menu_id,
          type: menuRow.tipo, // Mapear tipo -> type
          path: menuRow.path,
          view_id: menuRow.view_id,
          label: menuRow.label,
          icon: menuRow.icon,
          orden: menuRow.orden,
          requiere_exact_match: menuRow.requiere_exact_match,
          activo: menuRow.activo,
          roles: rolesResult.rows.map((r) => r.role),
          created_at: menuRow.created_at,
          updated_at: menuRow.updated_at,
        }

        res.json(menu)
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    } catch (error: any) {
      console.error('Error al actualizar menú:', error)
      if (error.code === '23505') {
        return res.status(400).json({ error: 'El menu_id ya existe' })
      }
      res.status(500).json({ error: 'Error al actualizar menú' })
    }
  },

  // Eliminar un menú (soft delete)
  async deleteMenu(req: Request, res: Response) {
    try {
      const { id } = req.params

      await pool.query('UPDATE menus SET activo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [
        id,
      ])

      res.json({ message: 'Menú eliminado correctamente' })
    } catch (error) {
      console.error('Error al eliminar menú:', error)
      res.status(500).json({ error: 'Error al eliminar menú' })
    }
  },
}

