const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../models');
const logger = require('../utils/logger');

const { User } = db;

/* ======================================================
   LOGIN
====================================================== */

exports.login = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {

            return res.status(400).json({
                success: false,
                error: 'Email and password required'
            });

        }

        const user = await User.findOne({
            where: { email }
        });

        if (!user) {

            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });

        }

        const passwordValid = await bcrypt.compare(password, user.password);

        if (!passwordValid) {

            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });

        }

        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        logger.info(`User login successful: ${user.email}`);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        logger.error('Login error:', error);

        res.status(500).json({
            success: false,
            error: 'Server error'
        });

    }

};


/* ======================================================
   GET CURRENT USER
====================================================== */

exports.me = async (req, res) => {

    try {

        const user = await User.findByPk(req.user.userId, {
            attributes: ['id', 'username', 'email', 'role']
        });

        if (!user) {

            return res.status(404).json({
                success: false,
                error: 'User not found'
            });

        }

        res.json({
            success: true,
            user
        });

    } catch (error) {

        logger.error('Fetch current user error:', error);

        res.status(500).json({
            success: false,
            error: 'Server error'
        });

    }

};


/* ======================================================
   LOGOUT
====================================================== */

exports.logout = async (req, res) => {

    try {

        logger.info(`User logged out: ${req.user?.email}`);

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {

        logger.error('Logout error:', error);

        res.status(500).json({
            success: false,
            error: 'Server error'
        });

    }

};