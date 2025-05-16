module.exports = (srv) => {
    // srv.on('getCustomAttrbute', async (req) => {
    //     const db = srv.tx(req);
    //     const config = await db.run(SELECT.one.from('portal_Power_Analytics_PowerBIPortal_Configuration'));
    //     return config; // Default to 'Guest' if no role found
    // });

    // srv.on('getUserInfo', async (req) => {
    //     console.log(req);
    //     return {
    //         username: 'dummy.user',
    //         roles: ['Test']
    //     };
    //     const user = req.user; // cds.User instance injected by CAP runtime from passport session

    //     if (!user || user.id === 'anonymous') {
    //         req.reject(401, 'User not authenticated');
    //     }

    //     return {
    //         username: user.username,
    //         roles: user.roles || []
    //     };
    // });

};
