const bcrypt = require('bcryptjs'); // Use bcryptjs instead of bcrypt

module.exports = cds.service.impl(async function () {
    const { Users } = this.entities;

    this.before('CREATE', Users, async (req) => {
        // console.log(req.user);
        if (req.data.Password) {
            const saltRounds = 10;
            req.data.Password = await bcrypt.hash(req.data.Password, saltRounds);
        }
    });
});

