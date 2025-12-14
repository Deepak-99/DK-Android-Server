// routes/rbac.js
const express = require('express');
const {
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  UserPermission
} = require('../config/database');

const {
  authenticateToken,
  requireAdmin,
  requirePermission
} = require('../middleware/auth');

const { Op } = require('sequelize');
const logger = require('../utils/logger');

const router = express.Router();

/* =========================================================
   1) LIST USERS (for Users tab)
   GET /api/rbac/users?q=&role=&status=
========================================================= */
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { q, role, status } = req.query;

    const where = {};

    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } }
      ];
    }

    if (role) where.role = role;
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    const users = await User.findAll({
      where,
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      data: { users }
    });
  } catch (err) {
    logger.error('RBAC: list users failed:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


/* =========================================================
   2) GET EFFECTIVE USER PERMISSIONS
   GET /api/rbac/users/:userId/permissions
========================================================= */
router.get(
  '/users/:userId/permissions',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const userId = req.params.userId;

      const user = await User.findByPk(userId, {
        attributes: ['id', 'name', 'email', 'role', 'isActive']
      });
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // ROLE → PERMISSIONS
      const roles = await UserRole.findAll({ where: { userId }, raw: true });
      const roleIds = roles.map(r => r.roleId);

      let rolePermissions = [];
      if (roleIds.length) {
        rolePermissions = await RolePermission.findAll({
          where: { roleId: roleIds },
          raw: true
        });
      }

      const permissionIds = rolePermissions.map(rp => rp.permissionId);
      let permissionRecords = [];

      if (permissionIds.length) {
        permissionRecords = await Permission.findAll({
          where: { id: permissionIds },
          raw: true
        });
      }

      // USER OVERRIDES
      const userOverrides = await UserPermission.findAll({
        where: { userId, allowed: true },
        raw: true
      });

      // Convert everything into uniform { resource, action }
      const effective = [];

      permissionRecords.forEach(p => {
        if (p.key) {
          const [resource, action] = p.key.split('.');
          effective.push({ resource, action });
        }
      });

      userOverrides.forEach(o => {
        effective.push({
          resource: o.resource,
          action: o.action
        });
      });

      res.json({
        success: true,
        data: {
          user,
          permissions: effective
        }
      });

    } catch (err) {
      logger.error('RBAC: get user permissions failed:', err);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);


/* =========================================================
   3) UPDATE USER PERMISSIONS (OVERLAYS)
   POST /api/rbac/users/:userId/permissions
========================================================= */
router.post(
  '/users/:userId/permissions',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const userId = req.params.userId;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          error: 'permissions must be array of {resource, action}'
        });
      }

      // Remove old overrides
      await UserPermission.destroy({ where: { userId } });

      // Build new overrides
      const bulk = permissions.map(p => ({
        userId,
        resource: p.resource,
        action: p.action,
        allowed: true
      }));

      if (bulk.length) {
        await UserPermission.bulkCreate(bulk);
      }

      res.json({ success: true, message: 'User permissions updated' });

    } catch (err) {
      logger.error('RBAC: update user permissions failed:', err);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);


/* =========================================================
   4) EXISTING ROUTES (unchanged)
========================================================= */

// List all roles with permissions
router.get('/roles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: [{
        model: Permission,
        as: 'permissions'
      }],
      order: [['id', 'ASC']]
    });

    res.json({ success: true, data: { roles } });
  } catch (err) {
    logger.error('Get roles error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// List all permissions
router.get('/permissions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      order: [['group', 'ASC'], ['key', 'ASC']]
    });

    res.json({ success: true, data: { permissions } });
  } catch (err) {
    logger.error('Get permissions error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get access for a user (roles + permissions)
router.get('/users/:userId/access', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      include: [{
        model: Role,
        as: 'roles',
        include: [{
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'key', 'label', 'group']
        }]
      }]
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: { user } });
  } catch (err) {
    logger.error('Get user access error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Assign roles to user
router.put('/users/:userId/roles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role_ids } = req.body;
    if (!Array.isArray(role_ids)) {
      return res.status(400).json({ success: false, error: 'role_ids must be array' });
    }

    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await UserRole.destroy({ where: { user_id: user.id } });

    const bulk = role_ids.map(id => ({
      user_id: user.id,
      role_id: id
    }));

    if (bulk.length) {
      await UserRole.bulkCreate(bulk);
    }

    res.json({ success: true, message: 'User roles updated successfully' });
  } catch (err) {
    logger.error('Update user roles error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// NEW ENDPOINT: list users with filters
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { q, role, status } = req.query;

        let where = {};
        if (q) where.email = { [Op.like]: `%${q}%` };
        if (status === 'active') where.isActive = true;
        if (status === 'inactive') where.isActive = false;

        const users = await User.findAll({
            where,
            include: [{ model: Role, as: 'roles' }],
            order: [['id', 'ASC']]
        });

        const filtered = role
            ? users.filter(u => u.roles.some(r => r.name === role))
            : users;

        res.json({ success: true, users: filtered });
    } catch (err) {
        logger.error('RBAC users error:', err);
        res.status(500).json({ error: 'server error' });
    }
});


// GET user permissions
router.get('/users/:userId/permissions', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.userId, {
            include: [
                { model: Role, as: 'roles', include: [{ model: Permission, as: 'permissions' }] }
            ]
        });

        const userPerms = await UserPermission.findAll({
            where: { user_id: user.id, allowed: true }
        });

        const permissions = [
            ...userPerms.map(p => ({ resource: p.resource, action: p.action })),
            ...user.roles.flatMap(r =>
                r.permissions.map(p => ({ resource: p.group, action: p.key }))
            )
        ];

        res.json({ success: true, user, permissions });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'server error' });
    }
});


// POST update user permissions
router.post('/users/:userId/permissions', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { permissions } = req.body;

        await UserPermission.destroy({ where: { user_id: req.params.userId } });

        if (Array.isArray(permissions) && permissions.length) {
            await UserPermission.bulkCreate(
                permissions.map(p => ({
                    user_id: req.params.userId,
                    resource: p.resource,
                    action: p.action,
                    allowed: true
                }))
            );
        }

        res.json({ success: true });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: 'server error' });
    }
});


// Update permissions for a role
router.put('/roles/:roleId/permissions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { permission_ids } = req.body;

    if (!Array.isArray(permission_ids)) {
      return res.status(400).json({ success: false, error: 'permission_ids must be array' });
    }

    const role = await Role.findByPk(req.params.roleId);
    if (!role) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }

    if (role.is_system && role.name === 'admin') {
      return res.status(400).json({ success: false, error: 'Cannot modify admin role' });
    }

    await RolePermission.destroy({ where: { role_id: role.id } });

    const bulk = permission_ids.map(pid => ({
      role_id: role.id,
      permission_id: pid
    }));

    if (bulk.length) {
      await RolePermission.bulkCreate(bulk);
    }

    res.json({ success: true, message: 'Role permissions updated successfully' });
  } catch (err) {
    logger.error('Update role permissions error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET: List users (filterable)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { q = '', role = '', status = '' } = req.query;

        const where = {};
        if (q) {
            where[Op.or] = [
                { name: { [Op.like]: `%${q}%` } },
                { email: { [Op.like]: `%${q}%` } }
            ];
        }

        if (status === 'active') where.isActive = true;
        if (status === 'inactive') where.isActive = false;

        const users = await User.findAll({
            where,
            order: [['id', 'ASC']]
        });

        // role filtering is done post-query because your model stores role as string
        const filtered = role ? users.filter(u => u.role === role) : users;

        res.json({
            success: true,
            users: filtered.map(u => u.get({ plain: true }))
        });

    } catch (err) {
        logger.error("List users error:", err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// GET: load user permissions
router.get('/users/:userId/permissions', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findByPk(userId, {
            attributes: ['id', 'name', 'email', 'role']
        });

        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        const permissions = await UserPermission.findAll({
            where: { userId },
            attributes: ['resource', 'action']
        });

        res.json({
            success: true,
            user,
            permissions: permissions.map(p => p.get({ plain: true }))
        });

    } catch (err) {
        logger.error("Get user permissions error:", err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// POST: update user permission set
router.post('/users/:userId/permissions', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;
        const { permissions = [] } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        // admin always has full access → optional rule
        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                error: "Admin role already has full permissions"
            });
        }

        // clear old
        await UserPermission.destroy({ where: { userId } });

        // insert new
        const inserts = permissions.map(p => ({
            userId,
            resource: p.resource,
            action: p.action,
            allowed: true
        }));

        if (inserts.length) await UserPermission.bulkCreate(inserts);

        res.json({
            success: true,
            message: "Permissions updated",
            count: inserts.length
        });

    } catch (err) {
        logger.error("Save user permissions error:", err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});


module.exports = router;
