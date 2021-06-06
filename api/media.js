const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const mysqlPool = require('../lib/mysqlPool');
/*
 * API sub-router for spotifylike collection endpoints.
 */

const router = require('express').Router();

router.get('/songs/:id', async (req, res) => {
    res.status(500).send({err: "not implemented"})
});

module.exports = router;
