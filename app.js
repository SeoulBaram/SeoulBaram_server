const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const cors = require('cors');

const indexRouter = require('./routes/index');

const app = express();

app.use((req, res, next) => {
  res.r = (result) => {
    res.json({
        status: true,
        message: "success",
        data: result,
    })
  };
  next();
});

//view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//middleware - logger
app.use(logger('dev'));
//middleware - body-parser
app.use(bodyParser.urlencoded({ extended: false }));
//middleware - cookie-parser
app.use(cookieParser());
//middleware - static
app.use(express.static(path.join(__dirname, 'public')));
//middleware - helmet
app.use(helmet());
//middleware - cors
app.use(cors());

//log input data
app.use((req, res, next) => {
  console.log('\n');
  console.log("query", req.query);
  console.log("params", req.params);
  console.log("body", req.body);

  next();
});

app.use('/', indexRouter);

//error handler
require('./ErrorHandler')(app);

//catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

//middleware - error-handler
app.use((err, req, res, next) => {
  //set locals, only providing error in development
  res.locals.message = err.message;
  console.log("res.locals.message error : " + res.locals.message);
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.log("res.locals.error error : " + res.locals.error);

  //render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
