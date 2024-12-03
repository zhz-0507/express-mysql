const express = require('express');
const router = express.Router();

const { Op } = require('sequelize');
const { Category, Course } = require('../../models');

const { NotFoundError } = require('../../utils/errors');
const { success, failure } = require('../../utils/responses');
/**
 * 查询分类列表
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
      order: [
        ['rank', 'ASC'],
        ['id', 'ASC'],
      ],
      limit: pageSize,
      offset,
    };
    // 如果有 name 查询参数，就添加到 where 条件中
    if (query.name) {
      condition.where = {
        name: {
          [Op.like]: `%${query.name}%`,
        },
      };
    }
    if (query.rank) {
      condition.where = {
        rank: {
          [Op.like]: `%${query.rank}%`,
        },
      };
    }

    const { count, rows } = await Category.findAndCountAll(condition);
    // 查询分类列表
    success(res, '查询分类列表成功。', {
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
 * 查询分类详情
 */
router.get('/:id', async function (req, res, next) {
  try {
    const category = await getCategory(req);
    success(res, '查询分类成功', { category });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 创建分类
 */

router.post('/', async (req, res) => {
  try {
    const { name, rank } = req.body;

    // 确保 name 和 rank 都不为空
    if (!name) {
      return res.status(400).json({ error: '标题必须存在' });
    }
    if (!rank) {
      return res.status(400).json({ error: '内容必须存在' });
    }

    // 创建分类
    const category = await Category.create({
      name: name,
      rank: rank,
    });

    success(res, '创建分类成功。', { category }, 201);
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 删除分类
 */

router.delete('/:id', async function (req, res, next) {
  try {
    const category = await getCategory(req);
    const count = await Course.count({ where: { categoryId: req.params.id } });
    if (count > 0) {
      throw new Error('当前分类有课程，无法删除。');
    }

    await category.destroy();

    if (category) {
      success(res, '删除分类成功。');
    } else {
      res.status(404).json({
        status: false,
        message: '分类不存在',
        data: null,
      });
    }
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 更新分类
 */
router.put('/:id', async function (req, res, next) {
  try {
    const category = await getCategory(req);
    const body = filterBody(req);

    await category.update(body);
    success(res, '更新分类成功。', { category });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 过滤 body
 */
function filterBody(req) {
  return {
    name: req.body.name,
    rank: req.body.rank,
  };
}

/**
 * 公共方法：查询当前分类
 */

async function getCategory(req) {
  // 获取分类 ID
  const { id } = req.params;
  const condition = {
    include: [
      {
        model: Course,
        as: 'courses',
      },
    ],
  };
  // 查询当前分类
  const category = await Category.findByPk(id, condition);

  // 如果没有找到，就抛出异常
  if (!category) {
    throw new NotFoundError(`ID: ${id}的分类未找到。`);
  }

  return category;
}

module.exports = router;
