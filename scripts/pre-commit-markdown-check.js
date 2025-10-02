#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// 检查是否有 Markdown 文件被修改
try {
  const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf-8' });
  const markdownFiles = stagedFiles.split('\n').filter(file => file.endsWith('.md'));
  
  if (markdownFiles.length > 0) {
    console.log('Checking Markdown files for formatting issues...');
    
    // 运行 markdownlint 检查
    try {
      execSync(`npx markdownlint ${markdownFiles.join(' ')}`, { stdio: 'inherit' });
      console.log('✓ All Markdown files passed linting checks');
    } catch (error) {
      console.error('✗ Markdown linting failed. Please fix the issues before committing.');
      process.exit(1);
    }
  }
} catch (error) {
  console.error('Error checking Markdown files:', error.message);
  process.exit(1);
}