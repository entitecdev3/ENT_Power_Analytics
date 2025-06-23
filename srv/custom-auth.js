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
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false, httpOnly: true, maxAge: 60 * 60 * 1000 } // 1 hour session
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    // Passport local strategy
    passport.use(new LocalStrategy(async (username, password, done) => {
        try {
            const db = cds.db;
            let user = await db.run(SELECT.one.from('portal_Power_Analytics_PowerBIPortal_Users').where({ username }).columns(['ID', 'username', 'password', 'role_ID']));
            if (!user) return done(null, false, { message: 'Invalid username or password' });
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) return done(null, false, { message: 'Invalid username or password' });
            // let userRolesIDs = (await db.run(SELECT.from('portal_Power_Analytics_PowerBIPortal_UserRoles').where({ user_ID:user.ID }).columns(['role_ID']))).map(item=>item.role_ID);
            let roles = (await db.run(SELECT.from('portal_Power_Analytics_PowerBIPortal_Roles').where({ ID: user.role_ID }).columns(['name']))).map(item => item.name);
            return done(null, new cds.User({ id: user.ID, username: user.username, roles }));
        } catch (err) {
            return done(err);
        }
    }));

    // Serialize user (store in session)
    passport.serializeUser((user, done) => {
        // done(null, user.id);
        if (user.id) {
            done(null, user.id);
        } else {
            done(null, user);
        }
    });

    // Deserialize user (retrieve from session)
    passport.deserializeUser(async (userSession, done) => {
        try {

            if (typeof userSession === 'object' && userSession.username) {
                return done(null, new cds.User({
                    id: userSession.id || userSession.username, // fallback if no ID
                    username: userSession.username,
                    roles: userSession.roles || [],
                    ...userSession
                }));
            }

            const db = cds.db;
            let user = await db.run(SELECT.one.from('portal_Power_Analytics_PowerBIPortal_Users').where({ ID: userSession }).columns(['ID', 'username', 'role_ID']));
            // let userRolesIDs = (await db.run(SELECT.from('portal_Power_Analytics_PowerBIPortal_UserRoles').where({ user_ID:user.ID }).columns(['role_ID']))).map(item=>item.role_ID);
            let roles = (await db.run(SELECT.from('portal_Power_Analytics_PowerBIPortal_Roles').where({ ID: user.role_ID }).columns(['name']))).map(item => item.name);
            return done(null, new cds.User({ id: user.ID, username: user.username, roles }));
        } catch (err) {
            done(err);
        }
    });

    // Login route
    app.post('/api/Login', (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            if (err) return next(err);
            if (!user) {
                return res.status(401).json({ success: false, message: info.message });
            }
            req.logIn(user, (err) => {
                if (err) return next(err);
                return res.json({ success: true, message: 'Logged in successfully', user });
            });
        })(req, res, next);
    });

    // Logout route
    app.post('/api/Logout', (req, res) => {
        req.logout((err) => {
            if (err) return res.status(500).send({ error: 'Logout failed' });
            res.send({ message: 'Logged out successfully' });
        });
    });

    app.get('/api/Report', (req, res, next) => {
        const token = req.query.token;
        if (!token) return res.redirect('/');

        try {
            const payload = jwt.verify(token, "entitec18", { clockTolerance: 30 });
            const referer = req.get("referer");


            const user = {
                user: payload.sub,
                username: payload.username,
                roles: payload.roles || {},
                externalRoles: payload.externalRoles || [],
                database: payload.database,
                referer: referer
            };



            req.logIn(user, (err) => {
                if (err) {
                    console.error('Passport login failed:', err);
                    return res.status(401).send('Login failed');
                }


                // Optional: store more in req.session.user if needed
                req.session.user = user;

                // This will now be recognized by CAPM @requires
                return res.redirect('/#/Report');
            });

        } catch (err) {
            console.error('JWT Verification Failed:', err);
            return res.status(401).send('Invalid or expired token');
        }
    });

    return async function (req, res, next) {
        // do your custom authentication
        if (!(req.isAuthenticated() || req.path === '/api/Login' || req.path === '/api/Logout')) {
            res.status(401).send({ error: 'Unauthorized: Please Login' });
            return;
        }
        next();
    }
}