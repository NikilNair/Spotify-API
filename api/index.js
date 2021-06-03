const router = require('express').Router();

router.use('/playlists', require('./playlists'));
router.use('/reviews', require('./reviews'));
router.use('/songs', require('./songs'));
router.use('/users', require('./users'));

module.exports = router;
