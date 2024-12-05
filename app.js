const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const adminAuth = require('./middlewares/admin-auth');
const userAuth = require('./middlewares/user-auth');
require('dotenv').config();

// 后台路由
const articlesRouter = require('./routes/admin/article');
const categoriesRouter = require('./routes/admin/categorie');
const settingsRouter = require('./routes/admin/setting');
const userRouter = require('./routes/admin/user');
const coursesRouter = require('./routes/admin/courses');
const chaptersRouter = require('./routes/admin/chapters');
const chartsRouter = require('./routes/admin/charts');
const adminAuthRouter = require('./routes/admin/auth');

// 前台路由
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const categorieRouter = require('./routes/categories');
const courseRouter = require('./routes/courses');
const chapterRouter = require('./routes/chapters');
const articleRouter = require('./routes/articles');
const settingRouter = require('./routes/settings');
const searchRouter = require('./routes/search');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 后台的接口
app.use('/admin/article', adminAuth, articlesRouter);
app.use('/admin/categorie', adminAuth, categoriesRouter);
app.use('/admin/setting', adminAuth, settingsRouter);
app.use('/admin/user', adminAuth, userRouter);
app.use('/admin/courses', adminAuth, coursesRouter);
app.use('/admin/chapters', adminAuth, chaptersRouter);
app.use('/admin/charts', adminAuth, chartsRouter);
app.use('/admin/auth', adminAuthRouter);

// 前台的接口
app.use('/auth', authRouter);
app.use('/', userAuth, indexRouter);
app.use('/categories', userAuth, categorieRouter);
app.use('/courses', userAuth, courseRouter);
app.use('/chapters', userAuth, chapterRouter);
app.use('/articles', userAuth, articleRouter);
app.use('/settings', userAuth, settingRouter);
app.use('/search', userAuth, searchRouter);

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
