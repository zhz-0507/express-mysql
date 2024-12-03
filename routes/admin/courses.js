const express = require('express');
const router = express.Router();

const { Op } = require('sequelize');
const { Course, Category, User, Chapter } = require('../../models');

const { NotFoundError } = require('../../utils/errors');
const { success, failure } = require('../../utils/responses');
/**
 * 查询课程列表
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
      ...getCondition(),
      order: [['id', 'asc']],
      limit: pageSize,
      offset,
    };
    if (query.categoryId) {
      condition.where = {
        categoryId: {
          [Op.eq]: query.categoryId,
        },
      };
    }

    if (query.userId) {
      condition.where = {
        userId: {
          [Op.eq]: query.userId,
        },
      };
    }

    if (query.name) {
      condition.where = {
        name: {
          [Op.like]: `%${query.name}%`,
        },
      };
    }

    if (query.recommended) {
      condition.where = {
        recommended: {
          // 需要转布尔值
          [Op.eq]: query.recommended === 'true',
        },
      };
    }

    if (query.introductory) {
      condition.where = {
        introductory: {
          [Op.eq]: query.introductory === 'true',
        },
      };
    }

    const { count, rows } = await Course.findAndCountAll(condition);
    // 查询课程列表
    success(res, '查询课程列表成功。', {
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
 * 查询课程详情
 */
router.get('/:id', async function (req, res, next) {
  try {
    const course = await getCourse(req);
    success(res, '查询课程成功', { course });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 创建课程
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

    // 创建课程
    const course = await Course.create({
      title: title,
      content: content,
    });

    success(res, '创建课程成功。', { course }, 201);
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 删除课程
 */

router.delete('/:id', async function (req, res, next) {
  try {
    const course = await getCourse(req);

    const count = await Chapter.count({ where: { courseId: req.params.id } });
    if (count > 0) {
      throw new Error('当前课程有章节，无法删除。');
    }
    await course.destroy();
    success(res, '删除课程成功。');
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 更新课程
 */
router.put('/:id', async function (req, res, next) {
  try {
    const course = await getCourse(req);
    const body = filterBody(req);

    await course.update(body);
    success(res, '更新课程成功。', { course });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 过滤 body
 */
function filterBody(req) {
  return {
    categoryId: req.body.categoryId,
    userId: req.body.userId,
    name: req.body.name,
    image: req.body.image,
    recommended: req.body.recommended,
    introductory: req.body.introductory,
    content: req.body.content,
  };
}

/**
 * 公共方法：查询当前课程
 */

async function getCourse(req) {
  // 获取课程 ID
  const { id } = req.params;

  const condition = getCondition();
  // 查询当前课程
  const course = await Course.findByPk(id, condition);

  // 如果没有找到，就抛出异常
  if (!course) {
    throw new NotFoundError(`ID: ${id}的课程未找到。`);
  }

  return course;
}

/**
 * 公共方法：查询当前分类
 */
function getCondition() {
  return {
    attributes: { exclude: ['CategoryId', 'UserId'] },
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name'],
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar'],
      },
    ],
  };
}

module.exports = router;
