const express = require('express');
const router = express.Router();

const homeRouter = require('./home');
const searchRouter = require('./search');
const plannerRouter = require('./planner');
const bookmarkRouter = require('./bookmark');
const detailRouter = require('./detail');

router.use('/home', homeRouter);
router.use('/search', searchRouter);
router.use('/planner', plannerRouter);
router.use('/bookmark', bookmarkRouter);
router.use('/detail', detailRouter);

/* GET home page. */
router.get('/', async (req, res, next) => {
    res.r("good good good");
});

module.exports = router;
