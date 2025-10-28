const cds = require('@sap/cds');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const express = require('express');
const session = require('express-session');
const jwt = require('jsonwebtoken');

module.exports = function () {
    const app = cds.app;
    app.use(express.json());

    // Configure session middleware
    app.use(session({
        secret: 'entitec99',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false, httpOnly: true, maxAge: 60 * 60 * 1000 } // 1 hour
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    // Passport local strategy
    passport.use(new LocalStrategy(async (username, password, done) => {
        try {
            const db = cds.db;
            const user = await db.run(SELECT.one.from('portal_Power_Analytics_PowerBIPortal_Users')
                .where({ username })
                .columns(['ID', 'username', 'email', 'password', 'role_ID', 'company_ID']));
            if (!user) return done(null, false, { message: 'Invalid username or password' });

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) return done(null, false, { message: 'Invalid username or password' });

            const roles = (await db.run(SELECT.from('portal_Power_Analytics_PowerBIPortal_Roles')
                .where({ ID: user.role_ID })
                .columns(['name']))).map(r => r.name);

            const cdsUser = new cds.User({
                id: user.ID,
                username: user.username,
                roles,
                email: user.email,
                company_ID: user.company_ID
            });

            return done(null, cdsUser);
        } catch (err) {
            return done(err);
        }
    }));

    passport.serializeUser((user, done) => {
        // done(null, user.id || user);
        done(null, {
            id: user.id,
            username: user.username,
            email: user.email,
            roles: user.roles,
            company_ID: user.company_ID,
            portalType: user.portalType || 'standalone',
            referer: user.referer,
            externalRoles: user.externalRoles
        });
    });

    passport.deserializeUser(async (userSession, done) => {
        // try {
        //     if (typeof userSession === 'object' && userSession.username) {
        //         return done(null, new cds.User({
        //             id: userSession.id || userSession.username,
        //             username: userSession.username,
        //             roles: userSession.roles || [],
        //             email: userSession.email,
        //             company_ID: userSession.company_ID
        //         }));
        //     }

        //     const db = cds.db;
        //     const user = await db.run(SELECT.one.from('portal_Power_Analytics_PowerBIPortal_Users')
        //         .where({ ID: userSession })
        //         .columns(['ID', 'username', 'email', 'role_ID', 'company_ID']));
        //     const roles = (await db.run(SELECT.from('portal_Power_Analytics_PowerBIPortal_Roles')
        //         .where({ ID: user.role_ID })
        //         .columns(['name']))).map(r => r.name);

        //     return done(null, new cds.User({
        //         id: user.ID,
        //         username: user.username,
        //         email: user.email,
        //         company_ID: user.company_ID,
        //         roles
        //     }));
        // } catch (err) {
        //     done(err);
        // }
        try {
            // directly rebuild cds.User including portalType
            const cdsUser = new cds.User({
                id: userSession.id,
                username: userSession.username,
                email: userSession.email,
                roles: userSession.roles,
                company_ID: userSession.company_ID,
            });
            cdsUser.portalType = userSession.portalType || 'standalone';
            cdsUser.referer = userSession.referer ;
            cdsUser.externalRoles = userSession.externalRoles || [];
            done(null, cdsUser);
        } catch (err) {
            done(err);
        }
    });

    // Login route
    app.post('/api/Login', (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            if (err) return next(err);
            if (!user) return res.status(401).json({ success: false, message: info.message });

            req.logIn(user, (err) => {
                if (err) return next(err);

                req.session.portalType = 'standalone';
                return res.json({
                    success: true,
                    message: 'Logged in successfully',
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        roles: user.roles,
                        portalType: req.session.portalType
                    }
                });
            });
        })(req, res, next);
    });

    // Logout route
    app.post('/api/Logout', (req, res) => {
        req.logout(err => {
            if (err) return res.status(500).send({ error: 'Logout failed' });
            res.send({ message: 'Logged out successfully' });
        });
    });

    // JWT-based embedded login
    app.get('/api/Report', (req, res) => {
        const token = req.query.token;
        if (!token) return res.redirect('/');

        try {
            const payload = jwt.verify(token, "entitec18", { clockTolerance: 30 });
            const referer = req.get("referer");
            const user = {
                id: payload.sub,
                user: payload.sub,
                username: payload.username,
                roles: payload.roles || {},
                externalRoles: payload.externalRoles || [],
                database: payload.database,
                portalType: 'embed',
                referer: referer
            };

            req.logIn(user, (err) => {
                if (err) return res.status(401).send('Login failed');
                req.session.user = user;
                req.session.portalType = 'embed';
                return res.redirect('/#/Report');
            });
        } catch (err) {
            console.error('JWT Verification Failed:', err);
            return res.status(401).send('Invalid or expired token');
        }
    });

    // Make portalType available for downstream requests
    app.use((req, res, next) => {
        req.portalType = req.session?.portalType || 'standalone';
        next();
    });

    // Auth guard
    return async function (req, res, next) {
        if (!(req.isAuthenticated() || req.path === '/api/Login' || req.path === '/api/Logout')) {
            res.status(401).send({ error: 'Unauthorized: Please Login' });
            return;
        }
        next();
    };
};
