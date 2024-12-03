const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const adminAuth = require('./middlewares/admin-auth');
require('dotenv').config();

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const articleRouter = require('./routes/admin/article');
const categorieRouter = require('./routes/admin/categorie');
const settingRouter = require('./routes/admin/setting');
const userRouter = require('./routes/admin/user');
const coursesRouter = require('./routes/admin/courses');
const chaptersRouter = require('./routes/admin/chapters');
const chartsRouter = require('./routes/admin/charts');
const adminAuthRouter = require('./routes/admin/auth');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
// 后台的接口
app.use('/admin/article', adminAuth, articleRouter);
app.use('/admin/categorie', adminAuth, categorieRouter);
app.use('/admin/setting', adminAuth, settingRouter);
app.use('/admin/user', adminAuth, userRouter);
app.use('/admin/courses', adminAuth, coursesRouter);
app.use('/admin/chapters', adminAuth, chaptersRouter);
app.use('/admin/charts', adminAuth, chartsRouter);
app.use('/admin/auth', adminAuthRouter);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
