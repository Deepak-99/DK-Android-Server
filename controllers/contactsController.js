const { Contact, Device } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { createCard } = require('vcard-creator');

const {
    serverError,
    parsePagination
} = require('../utils/controllerHelpers');

/* ------------------------------------------------------------------
 * Shared helpers
 * ------------------------------------------------------------------ */

function getSafeJobTitle(contact) {
    return (
        contact.jobTitle ||
        contact.organization?.title ||
        contact.organization ||
        ''
    );
}

/* ------------------------------------------------------------------
 * Sync contacts from device
 * ------------------------------------------------------------------ */

exports.syncContacts = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { contacts } = req.body;
        const requestId = req.requestId || 'unknown';

        // Validate input
        if (!Array.isArray(contacts)) {
            return res.status(400).json({
                success: false,
                error: 'Contacts must be an array'
            });
        }

        // Check if device exists
        const device = await Device.findByPk(deviceId);
        if (!device) {
            return res.status(404).json({
                success: false,
                error: 'Device not found'
            });
        }

        // Process contacts in batches
        const BATCH_SIZE = 50;

        const results = {
            created: 0,
            updated: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
            const batch = contacts.slice(i, i + BATCH_SIZE);

            const batchResults = await Promise.all(
                batch.map(contact =>
                    processContact(deviceId, contact).catch(err => {
                        logger.error(`[${requestId}] Contact sync failed`, err);
                        return { error: err.message };
                    })
                )
            );

            batchResults.forEach(result => {
                if (result?.error) {
                    results.failed++;
                    results.errors.push(result.error);
                } else if (result.wasNew) {
                    results.created++;
                } else {
                    results.updated++;
                }
            });
        }

        logger.info(`[${requestId}] Synced ${contacts.length} contacts for ${deviceId}`);

        return res.json({
            success: true,
            data: results
        });

    } catch (error) {
        return serverError(res, logger, 'Failed to sync contacts', error);
    }
};

/* ------------------------------------------------------------------
 * Single contact processor
 * ------------------------------------------------------------------ */

async function processContact(deviceId, contact) {
    // Validate required fields
    if (!contact.contactId || !contact.displayName) {
        throw new Error('Missing required contact fields');
    }

    const [savedContact, created] = await Contact.findOrCreate({
        where: {
            deviceId,
            contactId: contact.contactId
        },
        defaults: {
            ...contact,
            id: uuidv4(),
            deviceId
        }
    });

    if (!created) {

        const safeUpdate = {
            displayName: contact.displayName,
            phoneNumbers: contact.phoneNumbers || [],
            emails: contact.emails || [],
            addresses: contact.addresses || [],
            organization: contact.organization || null,
            note: contact.note || null,
            jobTitle: contact.jobTitle || null,
            groups: contact.groups || []
        };

        await savedContact.update(safeUpdate);
    }

    return { wasNew: created };
}

/* ------------------------------------------------------------------
 * Get contacts (filter + pagination)
 * ------------------------------------------------------------------ */

exports.getContacts = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const {
            search,
            group,
            hasPhone,
            hasEmail,
            page,
            limit
        } = req.query;

        const { pageNum, limitNum, offset } = parsePagination(page, limit);

        const where = { deviceId };

        // Search by name, email, or phone
        if (search) {
            where[Op.or] = [
                { displayName: { [Op.iLike]: `%${search}%` } }
            ];
        }

        // Filter by group
        if (group) {
            where.groups = {
                [Op.contains]: [group]
            };
        }

        // Filter by contact type
        if (hasPhone === 'true') {
            where.phoneNumbers = {
                [Op.not]: null
            };
        }

        if (hasEmail === 'true') {
            where.emails = {
                [Op.not]: null
            };
        }

        // Execute query with pagination
        const { count, rows } = await Contact.findAndCountAll({
            where,
            order: [['displayName', 'ASC']],
            limit: limitNum,
            offset
        });

        return res.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: pageNum,
                totalPages: Math.ceil(count / limitNum)
            }
        });

    } catch (error) {
        return serverError(res, logger, 'Failed to fetch contacts', error);
    }
};

/* ------------------------------------------------------------------
 * Contact statistics
 * ------------------------------------------------------------------ */

exports.getContactStatistics = async (req, res) => {
    try {
        const { deviceId } = req.params;

        const totalContacts = await Contact.count({
            where: { deviceId }
        });

        const withPhone = await Contact.count({
            where: {
                deviceId,
                phoneNumbers: { [Op.not]: null }
            }
        });

        const withEmail = await Contact.count({
            where: {
                deviceId,
                emails: { [Op.not]: null }
            }
        });

        // Get contact groups
        const groups = await Contact.findAll({
            attributes: [
                [
                    Contact.sequelize.fn(
                        'DISTINCT',
                        Contact.sequelize.fn(
                            'jsonb_array_elements_text',
                            Contact.sequelize.col('groups')
                        )
                    ),
                    'group'
                ]
            ],
            where: {
                deviceId,
                groups: { [Op.ne]: null }
            },
            raw: true
        });

        return res.json({
            success: true,
            data: {
                totalContacts,
                byAccountType,
                withPhone,
                withEmail,
                groups: groups.map(g => g.group).filter(Boolean)
            }
        });

    } catch (error) {
        return serverError(res, logger, 'Failed to fetch contact statistics', error);
    }
};

/* ------------------------------------------------------------------
 * Delete contacts
 * ------------------------------------------------------------------ */

exports.deleteContacts = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { contactIds, all = false } = req.body;

        if (!all && (!Array.isArray(contactIds) || !contactIds.length)) {
            return res.status(400).json({
                success: false,
                error: 'No contact IDs provided'
            });
        }

        // Build where clause
        const where = { deviceId };

        if (!all) {
            where.id = { [Op.in]: contactIds };
        }

        // Delete contacts
        const deletedCount = await Contact.destroy({ where });

        return res.json({
            success: true,
            message: `Deleted ${deletedCount} contacts`
        });

    } catch (error) {
        return serverError(res, logger, 'Failed to delete contacts', error);
    }
};

/* ------------------------------------------------------------------
 * Export contacts
 * ------------------------------------------------------------------ */

exports.exportContacts = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { format = 'vcard' } = req.query;

        // Get all contacts for the device
        const contacts = await Contact.findAll({
            where: { deviceId },
            order: [['displayName', 'ASC']]
        });

        let data;
        let contentType;

        let fileName =
            `contacts_${deviceId}_${new Date().toISOString().split('T')[0]}`;

        switch (format.toLowerCase()) {

            case 'csv': {
                const { Parser } = require('json2csv');
                const parser = new Parser();
                data = parser.parse(contacts);
                contentType = 'text/csv';
                fileName += '.csv';
                break;
            }

            case 'vcard': {

                data = contacts.map(contact => {

                    const card = createCard();

                    card
                        .addName(
                            contact.name?.lastName || '',
                            contact.name?.firstName || ''
                        )
                        .addCompany(contact.organization || '')
                        .addJobtitle(getSafeJobTitle(contact))
                        .addNote(contact.note || '');

                    contact.phoneNumbers?.forEach(p =>
                        card.addPhoneNumber(p.value, p.type || 'WORK')
                    );

                    contact.emails?.forEach(e =>
                        card.addEmail(e.value, e.type || 'WORK')
                    );

                    return card.toString();

                }).join('\n\n');

                contentType = 'text/vcard';
                fileName += '.vcf';
                break;
            }

            default:
                data = JSON.stringify(contacts, null, 2);
                contentType = 'application/json';
                fileName += '.json';
        }

        // Set headers and send file
        res.setHeader('Content-Type', contentType);
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${fileName}`
        );

        return res.send(data);

    } catch (error) {
        return serverError(res, logger, 'Failed to export contacts', error);
    }
};
