// routes/rbac.js
const express = require('express');
const { Op } = require('sequelize');

const db = require('../models');
const {
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  UserPermission
} = db;

const { authenticateToken, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/*
-----------------------------------------
LIST USERS
-----------------------------------------
*/
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

    res.json({
      success: true,
      users: filtered
    });

  } catch (err) {

    logger.error('RBAC list users error', err);

    res.status(500).json({
      success: false,
      error: 'Server error'
    });

  }

});


/*
-----------------------------------------
GET USER PERMISSIONS
-----------------------------------------
*/
router.get('/users/:userId/permissions', authenticateToken, requireAdmin, async (req, res) => {

  try {

    const user = await User.findByPk(req.params.userId, {
      include: [
        {
          model: Role,
          as: 'roles',
          include: [{ model: Permission, as: 'permissions' }]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userOverrides = await UserPermission.findAll({
      where: { userId: user.id, allowed: true }
    });

    const permissions = [
      ...userOverrides.map(p => ({
        resource: p.resource,
        action: p.action
      })),
      ...user.roles.flatMap(r =>
        r.permissions.map(p => ({
          resource: p.group,
          action: p.key
        }))
      )
    ];

    res.json({
      success: true,
      user,
      permissions
    });

  } catch (err) {

    logger.error('RBAC get permissions error', err);

    res.status(500).json({
      success: false,
      error: 'Server error'
    });

  }

});


/*
-----------------------------------------
UPDATE USER PERMISSIONS
-----------------------------------------
*/
router.post('/users/:userId/permissions', authenticateToken, requireAdmin, async (req, res) => {

  try {

    const { permissions } = req.body;

    await UserPermission.destroy({
      where: { userId: req.params.userId }
    });

    if (Array.isArray(permissions) && permissions.length) {

      await UserPermission.bulkCreate(
        permissions.map(p => ({
          userId: req.params.userId,
          resource: p.resource,
          action: p.action,
          allowed: true
        }))
      );

    }

    res.json({
      success: true
    });

  } catch (err) {

    logger.error('RBAC update permissions error', err);

    res.status(500).json({
      success: false,
      error: 'Server error'
    });

  }

});


/*
-----------------------------------------
LIST ROLES
-----------------------------------------
*/
router.get('/roles', authenticateToken, requireAdmin, async (req, res) => {

  try {

    const roles = await Role.findAll({
      include: [{ model: Permission, as: 'permissions' }],
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      roles
    });

  } catch (err) {

    logger.error('RBAC roles error', err);

    res.status(500).json({
      success: false
    });

  }

});


/*
-----------------------------------------
LIST PERMISSIONS
-----------------------------------------
*/
router.get('/permissions', authenticateToken, requireAdmin, async (req, res) => {

  try {

    const permissions = await Permission.findAll({
      order: [['group', 'ASC'], ['key', 'ASC']]
    });

    res.json({
      success: true,
      permissions
    });

  } catch (err) {

    logger.error('RBAC permissions error', err);

    res.status(500).json({
      success: false
    });

  }

});

module.exports = router;