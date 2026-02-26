const fs = require('fs');
const { Op } = require('sequelize');

/* --------------------------------------------------
 * Standard error responder
 * -------------------------------------------------- */
function serverError(res, logger, message, error) {
    logger.error(message, error);
    return res.status(500).json({
        success: false,
        error: message
    });
}

/* --------------------------------------------------
 * Pagination helper
 * -------------------------------------------------- */
function parsePagination(page, limit) {
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const limitNum = Number(limit) > 0 ? Number(limit) : 50;
    const offset = (pageNum - 1) * limitNum;

    return { pageNum, limitNum, offset };
}

/* --------------------------------------------------
 * Date range filter
 * -------------------------------------------------- */
function buildDateFilter(startDate, endDate) {
    if (!startDate && !endDate) return undefined;

    const filter = {};
    if (startDate) filter[Op.gte] = new Date(startDate);
    if (endDate) filter[Op.lte] = new Date(endDate);

    return filter;
}

/* --------------------------------------------------
 * Safe file deletion
 * -------------------------------------------------- */
function safeUnlink(filePath, logger) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        logger?.warn?.(`Failed to delete file: ${filePath}`, err);
    }
}

module.exports = {
    serverError,
    parsePagination,
    buildDateFilter,
    safeUnlink
};
