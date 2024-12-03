const express = require('express');
const router = express.Router();

const { Op } = require('sequelize');
const { User } = require('../../models');

const { NotFoundError } = require('../../utils/errors');
const { success, failure } = require('../../utils/responses');
/**
 * 查询用户列表
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
    if (query.email) {
      condition.where = {
        email: {
          [Op.eq]: query.email,
        },
      };
    }

    if (query.username) {
      condition.where = {
        username: {
          [Op.eq]: query.username,
        },
      };
    }

    if (query.nickname) {
      condition.where = {
        nickname: {
          [Op.like]: `%${query.nickname}%`,
        },
      };
    }

    if (query.role) {
      condition.where = {
        role: {
          [Op.eq]: query.role,
        },
      };
    }

    const { count, rows } = await User.findAndCountAll(condition);
    // 查询用户列表
    success(res, '查询用户列表成功。', {
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
 * 查询用户详情
 */
router.get('/:id', async function (req, res, next) {
  try {
    const user = await getUser(req);
    success(res, '查询用户成', { user });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 创建用户
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

    // 创建用户
    const user = await User.create({
      title: title,
      content: content,
    });

    success(res, '创建用户成功。', { user }, 201);
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 删除用户
 */

router.delete('/:id', async function (req, res, next) {
  try {
    const user = await getUser(req);

    await user.destroy();

    if (user) {
      success(res, '删除用户成功。');
    } else {
      res.status(404).json({
        status: false,
        message: '用户不存在',
        data: null,
      });
    }
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 更新用户
 */
router.put('/:id', async function (req, res, next) {
  try {
    const user = await getUser(req);
    const body = filterBody(req);

    await user.update(body);
    success(res, '更新用户成功。', { user });
  } catch (error) {
    failure(res, error);
  }
});

/**
 * 过滤 body
 */
function filterBody(req) {
  return {
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
    nickname: req.body.nickname,
    sex: req.body.sex,
    company: req.body.company,
    introduce: req.body.introduce,
    role: req.body.role,
    avatar: req.body.avatar,
  };
}

/**
 * 公共方法：查询当前用户
 */

async function getUser(req) {
  // 获取用户 ID
  const { id } = req.params;

  // 查询当前用户
  const user = await User.findByPk(id);

  // 如果没有找到，就抛出异常
  if (!user) {
    throw new NotFoundError(`ID: ${id}的用户未找到。`);
  }

  return user;
}

module.exports = router;
