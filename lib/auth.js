const jwt = require('jsonwebtoken');

const mysqlPool = require('../lib/mysqlPool');

const {getUserById} = require('../models/user');

const secretKey = "SuperSecret";

function generateAuthToken(userId) {
  const payload = { sub: userId };
  return jwt.sign(payload, secretKey, { expiresIn: '24h' });
}
exports.generateAuthToken = generateAuthToken;

async function requireAuthentication(req, res, next) {

  const authHeader = req.get('Authorization') || '';
  const authHeaderParts = authHeader.split(' ');

  const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;


  if(token !== null){
    let payload;
    try {
        payload = jwt.verify(token, secretKey);
        req.user = payload.sub;
        console.log("Authorized User: " + req.user);
    } catch (err) {
        res.status(401).send({
        error: "Invalid authentication token."
        });
        return;
    }

    console.log("user");
    console.log(req.user);

    if(! payload.sub){
      console.log("no sub field to token");
      res.status(401).send({
        error: "Invalid authentication token."
        });
        return;
    }

    let userDetails;
    try{
      userDetails = await getUserById(parseInt(payload.sub));
    }
    catch(err){
      console.error(err);
      res.status(500).send({err: "server unable to access user admin details"});
      return;
    }
  
    req.admin = userDetails.admin;
    next();
  }
  else{
    res.status(403).send({err:"Auth token required"})
  }
}
exports.requireAuthentication = requireAuthentication;


function validateUser(req, userId) {
  if(! req.user){
    return false;
  }
  if(req.user == userId || req.admin == 1){
    return true;
  }
  else{
    return false;
  }
}
exports.validateUser = validateUser;