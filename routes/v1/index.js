const express = require('express');
const router = express.Router();

const weatherRouter = require('./v1/weather/index');
const cultureRouter = require('./v1/culture/index');

router.use('/weather', weatherRouter);
router.use('/culture', cultureRouter);

/* GET home page. */
router.get('/', async (req, res, next) => {
    res.r("good good good");
});

module.exports = router;
