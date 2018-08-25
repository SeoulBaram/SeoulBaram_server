const express = require('express');
const router = express.Router();

const mainRouter = require('./main');
const moreRouter = require('./more');

router.use('/main', mainRouter);
router.use('/more', moreRouter);

/* GET home page. */
router.get('/', async (req, res, next) => {
    res.r("good good good");
});

module.exports = router;
