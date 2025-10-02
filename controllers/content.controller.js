const Content = require('../models/Content');

// 获取所有内容
exports.getAllContents = async (req, res) => {
  try {
    const contents = await Content.find().sort({ createdAt: -1 });
    res.json(contents);
  } catch (error) {
    res.status(500).json({ message: '获取内容列表失败', error: error.message });
  }
};

// 根据ID获取内容
exports.getContentById = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: '内容未找到' });
    }
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: '获取内容详情失败', error: error.message });
  }
};

// 创建新内容
exports.createContent = async (req, res) => {
  try {
    const content = new Content(req.body);
    const savedContent = await content.save();
    res.status(201).json(savedContent);
  } catch (error) {
    res.status(400).json({ message: '创建内容失败', error: error.message });
  }
};

// 更新内容
exports.updateContent = async (req, res) => {
  try {
    const content = await Content.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!content) {
      return res.status(404).json({ message: '内容未找到' });
    }
    res.json(content);
  } catch (error) {
    res.status(400).json({ message: '更新内容失败', error: error.message });
  }
};

// 删除内容
exports.deleteContent = async (req, res) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);
    if (!content) {
      return res.status(404).json({ message: '内容未找到' });
    }
    res.json({ message: '内容删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除内容失败', error: error.message });
  }
};