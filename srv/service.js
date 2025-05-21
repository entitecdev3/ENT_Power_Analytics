const bcrypt = require('bcryptjs'); // Use bcryptjs instead of bcrypt

module.exports = cds.service.impl(async function () {
    const { Users } = this.entities;

    this.before('CREATE', Users, async (req) => {
        // console.log(req.user);
        if (req.data.password) {
            const saltRounds = 10;
            req.data.password = await bcrypt.hash(req.data.password, saltRounds);
        }
    });

    this.before('UPDATE', Users, async (req) => {
        // console.log(req.user);
        if (req.data.password) {
            const saltRounds = 10;
            req.data.password = await bcrypt.hash(req.data.password, saltRounds);
        }
    });

    this.before('*', async (req) => {
        if (!req.user) {
            req.reject(401, "Session expired. Please log in again.");
        }
    });
    
});

