const express = require('express');
const router = express.Router();

const v1Router = require('./v1/index');

router.use('/v1', v1Router);

/* GET home page. */
router.get('/', async (req, res, next) => {
  res.r("good good good");
});

module.exports = router;
