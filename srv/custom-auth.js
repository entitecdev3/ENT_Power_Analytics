module.exports = function custom_auth (req, res, next) {
    // do your custom authentication
  // if (!(req.isAuthenticated() || req.path === '/api/Login' || req.path === '/logout' || req.path === '/api/CustomAttribute')) {
  //   res.status(401).send({ error: 'Unauthorized: Please login' });
  //   return;
  // }
  next();
}