const express = require('express');
const { Op } = require('sequelize');
const { Device, Contact } = require('../config/database');
const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Submit contacts data (Device endpoint)
router.post('/', authenticateDevice, async (req, res) => {
  try {
    const device = await Device.findOne({ where: { device_id: req.deviceId } });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const { contacts } = req.body;
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contacts data'
      });
    }

    const contactData = contacts.map(contact => ({
      device_id: device.id,
      contact_id: contact.contact_id,
      display_name: contact.display_name,
      given_name: contact.given_name,
      family_name: contact.family_name,
      phone_numbers: contact.phone_numbers,
      email_addresses: contact.email_addresses,
      postal_addresses: contact.postal_addresses,
      organization: contact.organization,
      job_title: contact.job_title,
      photo_uri: contact.photo_uri,
      starred: contact.starred || false,
      times_contacted: contact.times_contacted || 0,
      last_time_contacted: contact.last_time_contacted ? new Date(contact.last_time_contacted) : null,
      custom_ringtone: contact.custom_ringtone,
      send_to_voicemail: contact.send_to_voicemail || false,
      notes: contact.notes,
      sync_timestamp: new Date()
    }));

    // Use upsert to handle duplicates
    const createdContacts = [];
    for (const contactInfo of contactData) {
      const [contact, created] = await Contact.findOrCreate({
        where: {
          device_id: device.id,
          contact_id: contactInfo.contact_id
        },
        defaults: contactInfo
      });

      if (!created) {
        await contact.update(contactInfo);
      }
      createdContacts.push(contact);
    }

    logger.info(`Contacts data received from device: ${req.deviceId}, count: ${contacts.length}`);

    // Emit to admin room
    if (req.io) {
      req.io.to('admin-room').emit('contacts-updated', {
        device_id: req.deviceId,
        count: createdContacts.length
      });
    }

    res.json({
      success: true,
      message: `${createdContacts.length} contacts processed successfully`,
      data: { count: createdContacts.length }
    });
  } catch (error) {
    logger.error('Submit contacts error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get contacts for device (Admin only)
router.get('/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;

    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const whereClause = { device_id: device.id, is_deleted: false };
    
    if (search) {
      whereClause[Op.or] = [
        { display_name: { [Op.like]: `%${search}%` } },
        { given_name: { [Op.like]: `%${search}%` } },
        { family_name: { [Op.like]: `%${search}%` } },
        { organization: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: contacts } = await Contact.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['display_name', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_count: count,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get contact by ID (Admin only)
router.get('/:contactId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.contactId, {
      include: [
        {
          model: Device,
          as: 'device',
          attributes: ['id', 'device_id', 'device_name']
        }
      ]
    });

    if (!contact || contact.is_deleted) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: { contact }
    });
  } catch (error) {
    logger.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Search contacts across all devices (Admin only)
router.get('/search/:query', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 20 } = req.query;

    const contacts = await Contact.findAll({
      where: {
        is_deleted: false,
        [Op.or]: [
          { display_name: { [Op.like]: `%${query}%` } },
          { given_name: { [Op.like]: `%${query}%` } },
          { family_name: { [Op.like]: `%${query}%` } },
          { organization: { [Op.like]: `%${query}%` } }
        ]
      },
      include: [
        {
          model: Device,
          as: 'device',
          attributes: ['id', 'device_id', 'device_name']
        }
      ],
      limit: parseInt(limit),
      order: [['display_name', 'ASC']]
    });

    res.json({
      success: true,
      data: { contacts }
    });
  } catch (error) {
    logger.error('Search contacts error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get contact statistics (Admin only)
router.get('/stats/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const totalContacts = await Contact.count({
      where: { device_id: device.id, is_deleted: false }
    });

    const starredContacts = await Contact.count({
      where: { device_id: device.id, starred: true, is_deleted: false }
    });

    const contactsWithPhones = await Contact.count({
      where: {
        device_id: device.id,
        phone_numbers: { [Op.ne]: null },
        is_deleted: false
      }
    });

    const contactsWithEmails = await Contact.count({
      where: {
        device_id: device.id,
        email_addresses: { [Op.ne]: null },
        is_deleted: false
      }
    });

    const recentContacts = await Contact.findAll({
      where: { device_id: device.id, is_deleted: false },
      limit: 5,
      order: [['sync_timestamp', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        total_contacts: totalContacts,
        starred_contacts: starredContacts,
        contacts_with_phones: contactsWithPhones,
        contacts_with_emails: contactsWithEmails,
        recent_contacts: recentContacts
      }
    });
  } catch (error) {
    logger.error('Get contact stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Delete contacts for device (Admin only)
router.delete('/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const deletedCount = await Contact.update(
      { is_deleted: true },
      { where: { device_id: device.id, is_deleted: false } }
    );

    logger.info(`Contacts deleted for device: ${device.device_id}, count: ${deletedCount[0]}`);

    res.json({
      success: true,
      message: `${deletedCount[0]} contacts deleted successfully`
    });
  } catch (error) {
    logger.error('Delete contacts error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
