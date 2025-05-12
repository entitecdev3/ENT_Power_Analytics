const bcrypt = require('bcryptjs'); // Use bcryptjs instead of bcrypt

module.exports = cds.service.impl(async function () {
    const { Users, UserRoles } = this.entities;

    this.on('updateRoles', async (req) => {
        const { roles, userId } = req.data
        await cds.tx(req).run(async () => {
            try{
                await DELETE.from(UserRoles).where({ user_ID: userId })

                if (roles?.length) {
                    await INSERT.into(UserRoles).entries(
                    roles.map(role_ID => ({ user_ID: userId, role_ID }))
                    )
                }   
                return {
                    status: 'success',
                    message: 'Roles updated successfully'
                }

            } catch (error) {
                return {
                    status: 'error',
                    message: 'Failed to update roles'
                };
            }
        })
    });

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

