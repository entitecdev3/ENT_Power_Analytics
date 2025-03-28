const cds = require('@sap/cds');
const cov2ap = require("@cap-js-community/odata-v2-adapter");
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

cds.on('bootstrap', async (app) => {
    app.use(cov2ap());
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
            let user = await db.run(SELECT.one.from('portal_Power_Analytics_PowerBIPortal_Users').where({ username }));
            if (!user) return done(null, false, { message: 'Invalid username or password' });
            const validPassword = await bcrypt.compare(password, user.Password);
            if (!validPassword) return done(null, false, { message: 'Invalid username or password' });
            return done(null, {ID: user.UserID, username: user.UserName, roles:  [user.RoleID_RoleID]});
        } catch (err) {
            return done(err);
        }
    }));

    // Serialize user (store in session)
    passport.serializeUser((user, done) => {
        done(null, user.ID);
    });

    // Deserialize user (retrieve from session)
    passport.deserializeUser(async (id, done) => {
        try {
            const db = cds.db;
            const user = await db.run(SELECT.one.from('portal_Power_Analytics_PowerBIPortal_Users').where({ UserID: id }));
            return done(null, {ID: user.UserID, username: user.UserName, roles:  [user.RoleID_RoleID]});
        } catch (err) {
            done(err);
        }
    });

    // Login route
    app.post('/api/Login', passport.authenticate('local'), (req, res) => {
        res.send({ message: 'Login successful', user: req.user });
    });

    // Logout route
    app.post('/api/logout', (req, res) => {
        req.logout((err) => {
            if (err) return res.status(500).send({ error: 'Logout failed' });
            res.send({ message: 'Logged out successfully' });
        });
    });

});

module.exports = cds.server;
