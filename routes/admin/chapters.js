const express = require('express');
const router = express.Router();

const { Op } = require('sequelize');
const { Chapter } = require('../../models');

const { NotFoundError } = require('../../utils/errors');
const { success, failure } = require('../../utils/responses');
/**
 * 查询章节列表
 */
router.get('/', async function (req, res, next) {
  try {
    const query = req.query;

    // 处理分页
    // 获取分页参数
    const pageNum = Math.abs(query.pageNum || 1);
    const pageSize = Math.abs(query.pageSize || 10);

    const offset = (pageNum - 1) * pageSize;
    if (!query.courseId) {
      throw new Error('获取章节列表失败，课程ID不能为空。');
    }
    const condition = {
      ...getCondition(),
      order: [['id', 'asc']],
      limit: pageSize,
      offset,
    };

    condition.where = {
      courseId: {
        [Op.eq]: query.courseId,
      },
    };

    if (query.title) {
      condition.where = {
        title: {
          [Op.like]: `%${query.title}%`,
        },
      };
    }

    const { count, rows } = await Chapter.findAndCountAll(condition);
    // 查询章节列表
    success(res, '查询章节列表成功。', {
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
 * 查询章节详情
 */
router.get('/:id', async function (req, res, next) {
  try {
    const chapter = await getChapter(req);
    success(res, '查询章节成功', { chapter });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 创建章节
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

    // 创建章节
    const chapter = await Chapter.create({
      title: title,
      content: content,
    });

    success(res, '创建章节成功。', { chapter }, 201);
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 删除章节
 */

router.delete('/:id', async function (req, res, next) {
  try {
    const chapter = await getChapter(req);

    await chapter.destroy();

    if (chapter) {
      success(res, '删除章节成功。');
    } else {
      res.status(404).json({
        status: false,
        message: '章节不存在',
        data: null,
      });
    }
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 更新章节
 */
router.put('/:id', async function (req, res, next) {
  try {
    const chapter = await getChapter(req);
    const body = filterBody(req);

    await chapter.update(body);
    success(res, '更新章节成功。', { chapter });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 过滤 body
 */
function filterBody(req) {
  return {
    courseId: req.body.courseId,
    title: req.body.title,
    content: req.body.content,
    video: req.body.video,
    rank: req.body.rank,
  };
}

/**
 * 公共方法：查询当前章节
 */

async function getChapter(req) {
  // 获取章节 ID
  const { id } = req.params;
  const condition = getCondition();
  // 查询当前章节
  const chapter = await Chapter.findByPk(id, condition);

  // 如果没有找到，就抛出异常
  if (!chapter) {
    throw new NotFoundError(`ID: ${id}的章节未找到。`);
  }

  return chapter;
}

/**
 * 公共方法：关联课程数据
 * @returns {{include: [{as: string, model, attributes: string[]}], attributes: {exclude: string[]}}}
 */
function getCondition() {
  return {
    attributes: { exclude: ['CourseId'] },
    include: [
      {
        model: Course,
        as: 'course',
        attributes: ['id', 'name'],
      },
    ],
  };
}

module.exports = router;
