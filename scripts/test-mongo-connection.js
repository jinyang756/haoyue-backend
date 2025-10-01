const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://Vercel-Admin-haoyue:MypbYEewIVAA78qd@haoyue.7qpdasq.mongodb.net/?retryWrites=true&w=majority&appName=haoyue";

// 创建MongoClient对象，设置ServerApiVersion
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// 简单的连接测试函数
async function testConnection() {
  try {
    // 连接到MongoDB服务器
    await client.connect();
    console.log('正在连接到MongoDB Atlas...');
    
    // 发送ping命令确认连接成功
    await client.db("admin").command({ ping: 1 });
    console.log('✅ 成功连接到MongoDB Atlas！Ping命令执行成功。');
    
    // 获取数据库列表
    const databases = await client.db().admin().listDatabases();
    console.log('可用数据库列表:');
    databases.databases.forEach(db => {
      console.log(`- ${db.name} (大小: ${(db.sizeOnDisk / (1024 * 1024)).toFixed(2)} MB)`);
    });
    
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    // 确保客户端会关闭
    await client.close();
    console.log('MongoDB客户端已关闭');
  }
}

// 运行测试
console.log('开始MongoDB连接测试...');
testConnection().catch(console.error);