const express = require('express');
const router = express.Router();

const { Op } = require('sequelize');
const { Article } = require('../../models');
const { NotFoundError } = require('../../utils/errors');
const { success, failure } = require('../../utils/responses');
/**
 * 查询文章列表
 */
router.get('/', async function (req, res, next) {
  try {
    const query = req.query;

    // 处理分页
    // 获取分页参数
    const pageNum = Math.abs(query.pageNum || 1);
    const pageSize = Math.abs(query.pageSize || 10);

    const offset = (pageNum - 1) * pageSize;

    const condition = {
      order: [['id', 'asc']],
      limit: pageSize,
      offset,
    };
    // 如果有 title 查询参数，就添加到 where 条件中
    if (query.title) {
      condition.where = {
        title: {
          [Op.like]: `%${query.title}%`,
        },
      };
    }

    const { count, rows } = await Article.findAndCountAll(condition);
    // 查询文章列表
    success(res, '查询文章列表成功。', {
      list: rows,
      pagination: {
        pageNum,
        pageSize,
        total: count,
        totalPage: Math.ceil(count / pageSize),
      },
    });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 查询文章详情
 */
router.get('/:id', async function (req, res, next) {
  try {
    const article = await getArticle(req);
    success(res, '查询文章成功', { article });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 创建文章
 */

router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;

    // 确保 title 和 content 都不为空
    if (!title) {
      return res.status(400).json({ error: '标题必须存在' });
    }
    if (!content) {
      return res.status(400).json({ error: '内容必须存在' });
    }

    // 创建文章
    const article = await Article.create({
      title: title,
      content: content,
    });

    success(res, '创建文章成功。', { article }, 201);
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 删除文章
 */

router.delete('/:id', async function (req, res, next) {
  try {
    const article = await getArticle(req);

    await article.destroy();

    if (article) {
      success(res, '删除文章成功。');
    } else {
      res.status(404).json({
        status: false,
        message: '文章不存在',
        data: null,
      });
    }
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 更新文章
 */
router.put('/:id', async function (req, res, next) {
  try {
    const article = await getArticle(req);
    const body = filterBody(req);

    await article.update(body);
    success(res, '更新文章成功。', { article });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 过滤 body
 */
function filterBody(req) {
  return {
    title: req.body.title,
    content: req.body.content,
  };
}

/**
 * 公共方法：查询当前文章
 */

async function getArticle(req) {
  // 获取文章 ID
  const { id } = req.params;

  // 查询当前文章
  const article = await Article.findByPk(id);

  // 如果没有找到，就抛出异常
  if (!article) {
    throw new NotFoundError(`ID: ${id}的文章未找到。`);
  }

  return article;
}

module.exports = router;
