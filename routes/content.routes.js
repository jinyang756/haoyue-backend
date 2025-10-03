const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const { protect, authorize } = require('../middleware/auth');

// 公开接口 - 获取已发布的内容
router.get('/', contentController.getAllContents);

// 管理员接口 - 需要认证和管理员权限
router.post('/', protect, authorize(['admin']), contentController.createContent);
router.get('/:id', contentController.getContentById);
router.put('/:id', protect, authorize(['admin']), contentController.updateContent);
router.delete('/:id', protect, authorize(['admin']), contentController.deleteContent);

module.exports = router;