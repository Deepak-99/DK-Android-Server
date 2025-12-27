// routes/events.js
import router from "./sms";
import {authenticateToken} from "../middleware/auth";
import {Model as NormalizedEvent} from "sequelize";

router.get('/', authenticateToken, async (req, res) => {
    const events = await NormalizedEvent.findAll({
        where: { device_id: req.query.deviceId },
        order: [['timestamp', 'DESC']],
        limit: 500
    });

    res.json({ success: true, data: events });
});
