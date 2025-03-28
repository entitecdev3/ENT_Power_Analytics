module.exports = (srv) => {
    
    srv.on('getCustomAttrbute', async (req) => {
        const db = srv.tx(req);
        const config = await db.run(SELECT.one.from('portal_Power_Analytics_PowerBIPortal_Configuration'));
        return config; // Default to 'Guest' if no role found
    });

};
