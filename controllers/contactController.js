const { Contact, Device } = require('../../../models');
const { Op } = require('sequelize');
const logger = require('../../../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Sync contacts from device to server
 */
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
            const batchPromises = batch.map(contact => 
                processContact(deviceId, contact).catch(error => {
                    logger.error(`[${requestId}] Error processing contact:`, error);
                    return { error: error.message };
                })
            );

            const batchResults = await Promise.all(batchPromises);
            
            batchResults.forEach(result => {
                if (result && !result.error) {
                    if (result.wasNew) results.created++;
                    else results.updated++;
                } else {
                    results.failed++;
                    if (result?.error) {
                        results.errors.push(result.error);
                    }
                }
            });
        }

        logger.info(`[${requestId}] Synced ${contacts.length} contacts for device ${deviceId}: ${results.created} created, ${results.updated} updated, ${results.failed} failed`);

        return res.json({
            success: true,
            data: results
        });

    } catch (error) {
        logger.error('Error syncing contacts:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to sync contacts',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Process a single contact (create or update)
 */
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
            deviceId,
            id: uuidv4()
        }
    });

    if (!created) {
        await savedContact.update(contact);
    }

    return { wasNew: created, contact: savedContact };
}

/**
 * Get contacts with filtering and pagination
 */
exports.getContacts = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { 
            search,
            group,
            hasPhone,
            hasEmail,
            page = 1, 
            limit = 50 
        } = req.query;

        // Build where clause
        const where = { deviceId };
        
        // Search by name, email, or phone
        if (search) {
            where[Op.or] = [
                { displayName: { [Op.like]: `%${search}%` } },
                { 'emails.value': { [Op.like]: `%${search}%` } },
                { 'phoneNumbers.value': { [Op.like]: `%${search}%` } }
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
            where['phoneNumbers'] = {
                [Op.not]: null,
                [Op.not]: []
            };
        }

        if (hasEmail === 'true') {
            where['emails'] = {
                [Op.not]: null,
                [Op.not]: []
            };
        }

        // Execute query with pagination
        const { count, rows } = await Contact.findAndCountAll({
            where,
            order: [['displayName', 'ASC']],
            limit: parseInt(limit),
            offset: (page - 1) * limit
        });

        return res.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        logger.error('Error fetching contacts:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch contacts'
        });
    }
};

/**
 * Get contact statistics
 */
exports.getContactStatistics = async (req, res) => {
    try {
        const { deviceId } = req.params;

        // Get total contact count
        const totalContacts = await Contact.count({ where: { deviceId } });

        // Get contacts by account type
        const byAccountType = await Contact.findAll({
            attributes: [
                [Contact.sequelize.fn('jsonb_array_elements_text', Contact.sequelize.col('accounts')), 'accountType'],
                [Contact.sequelize.fn('COUNT', Contact.sequelize.col('id')), 'count']
            ],
            where: {
                deviceId,
                accounts: { [Op.ne]: null }
            },
            group: ['accountType'],
            raw: true
        });

        // Get contacts with phone/email
        const withPhone = await Contact.count({ 
            where: { 
                deviceId,
                phoneNumbers: { [Op.not]: null, [Op.not]: [] }
            } 
        });

        const withEmail = await Contact.count({ 
            where: { 
                deviceId,
                emails: { [Op.not]: null, [Op.not]: [] }
            } 
        });

        // Get contact groups
        const groups = await Contact.findAll({
            attributes: [
                [Contact.sequelize.fn('DISTINCT', Contact.sequelize.fn('jsonb_array_elements_text', Contact.sequelize.col('groups'))), 'group']
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
        logger.error('Error fetching contact statistics:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch contact statistics'
        });
    }
};

/**
 * Delete contacts
 */
exports.deleteContacts = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { contactIds, all = false } = req.body;

        // Validate input
        if (!all && (!Array.isArray(contactIds) || contactIds.length === 0)) {
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
        logger.error('Error deleting contacts:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete contacts'
        });
    }
};

/**
 * Export contacts
 */
exports.exportContacts = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { format = 'vcard' } = req.query;

        // Get all contacts for the device
        const contacts = await Contact.findAll({
            where: { deviceId },
            order: [['displayName', 'ASC']]
        });

        // Format data based on requested format
        let data;
        let contentType;
        let fileName = `contacts_${deviceId}_${new Date().toISOString().split('T')[0]}`;

        switch (format.toLowerCase()) {
            case 'csv':
                // Convert to CSV
                const { Parser } = require('json2csv');
                const fields = [
                    'displayName',
                    'phoneNumbers.value',
                    'emails.value',
                    'organization',
                    'jobTitle',
                    'note'
                ];
                const json2csvParser = new Parser({ fields });
                data = json2csvParser.parse(contacts);
                contentType = 'text/csv';
                fileName += '.csv';
                break;

            case 'vcard':
                // Convert to vCard format
                const { createCard } = require('vcard-creator');
                const vcards = contacts.map(contact => {
                    const card = createCard();
                    
                    // Basic info
                    card
                        .addName(contact.name?.lastName || '', contact.name?.firstName || '')
                        .addCompany(contact.organization || '')
                        .addJobtitle(contact.jobTitle || '')
                        .addNote(contact.note || '');
                    
                    // Phone numbers
                    if (contact.phoneNumbers && Array.isArray(contact.phoneNumbers)) {
                        contact.phoneNumbers.forEach(phone => {
                            card.addPhoneNumber(phone.value, phone.type || 'WORK');
                        });
                    }
                    
                    // Emails
                    if (contact.emails && Array.isArray(contact.emails)) {
                        contact.emails.forEach(email => {
                            card.addEmail(email.value, email.type || 'WORK');
                        });
                    }
                    
                    // Addresses
                    if (contact.addresses && Array.isArray(contact.addresses)) {
                        contact.addresses.forEach(address => {
                            card.addAddress(
                                '', // No post office box
                                '', // Extended address
                                address.street || '',
                                address.city || '',
                                address.region || '',
                                address.postalCode || '',
                                address.country || '',
                                address.type || 'WORK'
                            );
                        });
                    }
                    
                    return card.toString();
                }).join('\n\n');
                
                data = vcards;
                contentType = 'text/vcard';
                fileName += '.vcf';
                break;

            case 'json':
            default:
                data = JSON.stringify(contacts, null, 2);
                contentType = 'application/json';
                fileName += '.json';
        }

        // Set headers and send file
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        return res.send(data);

    } catch (error) {
        logger.error('Error exporting contacts:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to export contacts'
        });
    }
};