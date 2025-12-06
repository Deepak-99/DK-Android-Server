const express = require('express');
const { Op } = require('sequelize');
const { Device, Contact } = require('../config/database');
const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Device endpoint: submit contacts data (bulk sync from Android)
 * POST /api/contacts
 */
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
      sync_timestamp: new Date(),
      is_deleted: false
    }));

    // Upsert contacts per device/contact_id
    const processedContacts = [];
    for (const contactInfo of contactData) {
      const [contactInstance, created] = await Contact.findOrCreate({
        where: {
          device_id: device.id,
          contact_id: contactInfo.contact_id
        },
        defaults: contactInfo
      });

      if (!created) {
        await contactInstance.update(contactInfo);
      }
      processedContacts.push(contactInstance);
    }

    logger.info(`Contacts data received from device: ${req.deviceId}, count: ${contacts.length}`);

    // Emit to admin room
    if (req.io) {
      req.io.to('admin-room').emit('contacts-updated', {
        device_id: req.deviceId,
        count: processedContacts.length
      });
    }

    res.json({
      success: true,
      message: `${processedContacts.length} contacts processed successfully`,
      data: { count: processedContacts.length }
    });
  } catch (error) {
    logger.error('Submit contacts error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * Get contacts for a specific device (Admin only, paginated + search)
 * GET /api/contacts/device/:deviceId?page=&limit=&search=
 */
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
      const likeSearch = `%${search}%`;
      whereClause[Op.or] = [
        { display_name: { [Op.like]: likeSearch } },
        { given_name: { [Op.like]: likeSearch } },
        { family_name: { [Op.like]: likeSearch } },
        { organization: { [Op.like]: likeSearch } },
        // Optional: basic JSON LIKE search for phone/emails/notes
        { phone_numbers: { [Op.like]: likeSearch } },
        { email_addresses: { [Op.like]: likeSearch } },
        { notes: { [Op.like]: likeSearch } }
      ];
    }

    const { count, rows: contacts } = await Contact.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['display_name', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          current_page: parseInt(page, 10),
          total_pages: Math.ceil(count / limit),
          total_count: count,
          per_page: parseInt(limit, 10)
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

/**
 * Get single contact by ID (Admin only)
 * GET /api/contacts/:contactId
 */
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

/**
 * Search contacts across all devices (Admin only)
 * GET /api/contacts/search/:query?limit=
 */
router.get('/search/:query', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 20 } = req.query;
    const likeQuery = `%${query}%`;

    const contacts = await Contact.findAll({
      where: {
        is_deleted: false,
        [Op.or]: [
          { display_name: { [Op.like]: likeQuery } },
          { given_name: { [Op.like]: likeQuery } },
          { family_name: { [Op.like]: likeQuery } },
          { organization: { [Op.like]: likeQuery } },
          { phone_numbers: { [Op.like]: likeQuery } },
          { email_addresses: { [Op.like]: likeQuery } },
          { notes: { [Op.like]: likeQuery } }
        ]
      },
      include: [
        {
          model: Device,
          as: 'device',
          attributes: ['id', 'device_id', 'device_name']
        }
      ],
      limit: parseInt(limit, 10),
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

/**
 * Get contact statistics for a device (Admin only)
 * GET /api/contacts/stats/device/:deviceId
 */
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

/**
 * Soft delete all contacts for a device (Admin only)
 * DELETE /api/contacts/device/:deviceId
 */
router.delete('/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const [affectedCount] = await Contact.update(
      { is_deleted: true },
      { where: { device_id: device.id, is_deleted: false } }
    );

    logger.info(`Contacts deleted for device: ${device.device_id}, count: ${affectedCount}`);

    res.json({
      success: true,
      message: `${affectedCount} contacts deleted successfully`
    });
  } catch (error) {
    logger.error('Delete contacts error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * Admin: create a new contact manually for a device
 * POST /api/contacts/device/:deviceId/admin
 */
router.post('/device/:deviceId/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    const payload = {
      device_id: device.id,
      ...req.body,
      sync_timestamp: new Date(),
      is_deleted: false
    };

    const created = await Contact.create(payload);

    res.json({ success: true, data: created });
  } catch (error) {
    logger.error('Admin create contact error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * Admin: update existing contact
 * PUT /api/contacts/:contactId/admin
 */
router.put('/:contactId/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.contactId);
    if (!contact || contact.is_deleted) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    await contact.update({
      ...req.body,
      sync_timestamp: new Date()
    });

    res.json({ success: true, data: contact });
  } catch (error) {
    logger.error('Admin update contact error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * Admin: hard delete a contact
 * DELETE /api/contacts/:contactId/admin
 */
router.delete('/:contactId/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deletedCount = await Contact.destroy({
      where: { id: req.params.contactId }
    });

    res.json({
      success: true,
      deleted: deletedCount
    });
  } catch (error) {
    logger.error('Admin hard delete contact error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * Export contacts for a device (CSV / VCF)
 * GET /api/contacts/device/:deviceId/export?format=csv|vcf
 */
router.get('/device/:deviceId/export', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const contacts = await Contact.findAll({
      where: { device_id: device.id, is_deleted: false },
      order: [['display_name', 'ASC']]
    });

    const format = (req.query.format || 'csv').toLowerCase();

    if (format === 'csv') {
      const header = 'display_name,given_name,family_name,phones,emails,organization,notes\n';
      const rows = contacts
        .map(c => {
          const phones = Array.isArray(c.phone_numbers) ? c.phone_numbers.map(p => p.number || p).join(';') : '';
          const emails = Array.isArray(c.email_addresses) ? c.email_addresses.map(e => e.email || e).join(';') : '';
          return `"${c.display_name || ''}","${c.given_name || ''}","${c.family_name || ''}","${phones}","${emails}","${c.organization || ''}","${(c.notes || '').toString().replace(/"/g, '""')}"`;
        })
        .join('\n');

      res.setHeader('Content-Disposition', `attachment; filename=contacts_${device.device_id}.csv`);
      res.setHeader('Content-Type', 'text/csv');
      return res.send(header + rows);
    }

    if (format === 'vcf' || format === 'vcard') {
      let vcf = '';
      contacts.forEach(c => {
        vcf += 'BEGIN:VCARD\nVERSION:3.0\n';
        if (c.display_name) vcf += `FN:${c.display_name}\n`;
        if (c.given_name || c.family_name) {
          vcf += `N:${c.family_name || ''};${c.given_name || ''};;;\n`;
        }
        if (Array.isArray(c.phone_numbers)) {
          c.phone_numbers.forEach(p => {
            const value = typeof p === 'string' ? p : p.number;
            if (value) vcf += `TEL;TYPE=CELL:${value}\n`;
          });
        }
        if (Array.isArray(c.email_addresses)) {
          c.email_addresses.forEach(e => {
            const value = typeof e === 'string' ? e : e.email;
            if (value) vcf += `EMAIL;TYPE=INTERNET:${value}\n`;
          });
        }
        if (c.organization) vcf += `ORG:${c.organization}\n`;
        if (c.job_title) vcf += `TITLE:${c.job_title}\n`;
        if (c.notes) vcf += `NOTE:${c.notes}\n`;
        vcf += 'END:VCARD\n';
      });

      res.setHeader('Content-Disposition', `attachment; filename=contacts_${device.device_id}.vcf`);
      res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
      return res.send(vcf);
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid export format. Use ?format=csv or ?format=vcf'
    });
  } catch (error) {
    logger.error('Export contacts error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
