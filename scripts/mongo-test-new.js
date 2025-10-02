const { MongoClient } = require('mongodb');

// MongoDB连接字符串（使用您提供的新凭据）
const uri = 'mongodb+srv://Vercel-Admin-haoyue:MypbYEewIVAA78qd@haoyue.7qpdasq.mongodb.net/?retryWrites=true&w=majority&appName=haoyue';

console.log('尝试连接到MongoDB...');
console.log('连接字符串:', uri.replace(/\/\/([^:]+):([^@]+)@/, '//[username]:[password]@'));

// 创建MongoClient实例
const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
});

async function testConnection() {
  try {
    // 连接到MongoDB
    console.log('正在连接到MongoDB...');
    await client.connect();
    console.log('✓ MongoDB连接成功!');
    
    // 获取数据库信息
    const db = client.db('test'); // 使用test数据库
    console.log('数据库名称:', db.databaseName);
    
    // 列出数据库中的集合
    const collections = await db.listCollections().toArray();
    console.log('数据库中的集合:', collections.map(c => c.name));
    
    // 关闭连接
    await client.close();
    console.log('✓ MongoDB连接已关闭');
  } catch (error) {
    console.error('✗ MongoDB连接失败:', error.message);
    
    // 提供详细的错误信息
    if (error.name === 'MongoServerSelectionError') {
      console.log('\n可能的原因:');
      console.log('1. 网络连接问题');
      console.log('2. MongoDB Atlas集群未启动');
      console.log('3. IP地址未添加到白名单');
      console.log('4. 用户名或密码错误');
      console.log('5. 连接字符串格式错误');
    }
  }
}

testConnection();