# 皓月后端项目分支策略

## 分支结构

本项目采用以下分支策略进行代码管理和版本控制：

### 主要分支

1. **main 分支**
   - 主要用于生产环境的代码部署
   - 包含稳定、可部署的代码
   - 不直接在main分支上进行开发
   - 所有提交到main分支的代码必须通过Pull Request进行审核

2. **develop 分支**
   - 用于开发环境的代码
   - 包含最新的开发代码
   - 功能分支完成后先合并到develop进行集成测试
   - 从main分支创建

## 工作流程

### 1. 从 main 分支创建功能分支

当需要开发新功能时，从最新的main分支创建新的功能分支：

```bash
# 确保main分支是最新的
git checkout main
git pull origin main

# 创建功能分支
git checkout -b feature/your-feature-name
```

功能分支命名规范：`feature/简短描述`，例如：`feature/add-authentication`

### 2. 开发完成后提交Pull Request

功能开发完成后：

1. 将功能分支推送到远程仓库
2. 创建从功能分支到main分支的Pull Request
3. 等待代码审核和测试
4. 审核通过后合并到main分支

### 3. 同步main分支更新到develop分支

当main分支有更新时，需要将这些更新同步到develop分支：

```bash
# 切换到develop分支
git checkout develop

# 拉取最新的main分支代码
git pull origin main

# 解决可能的合并冲突
# ...

# 将更新后的develop分支推送到远程
git push origin develop
```

### 4. 同步main分支更新到当前开发分支

当你在功能分支上开发时，如果main分支有更新，应该及时同步这些更新到你的功能分支：

```bash
# 切换到你的功能分支
git checkout feature/your-feature-name

# 拉取最新的main分支代码并合并到当前分支
git pull origin main

# 解决可能的合并冲突
# ...

# 将更新后的功能分支推送到远程
git push origin feature/your-feature-name
```

## 代码审查流程

1. 所有代码变更都必须通过Pull Request进行
2. 至少需要一名团队成员审核代码
3. 审核通过后才能合并代码
4. 合并后应删除对应的功能分支

## 部署流程

1. main分支的代码将自动部署到生产环境
2. develop分支的代码将自动部署到开发环境
3. 每次部署前必须运行完整的测试套件

---

请所有团队成员严格遵守此分支策略，以确保代码库的稳定性和可维护性。