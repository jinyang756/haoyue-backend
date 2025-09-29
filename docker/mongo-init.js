// 初始化MongoDB数据库
db.createUser({
  user: "admin",
  pwd: "password",
  roles: [
    {
      role: "root",
      db: "admin"
    }
  ]
});

// 切换到haoyue数据库
db = db.getSiblingDB("haoyue");

// 创建普通用户
db.createUser({
  user: "haoyue_user",
  pwd: "haoyue_password",
  roles: [
    {
      role: "readWrite",
      db: "haoyue"
    }
  ]
});

// 创建管理员用户
db.createUser({
  user: "haoyue_admin",
  pwd: "haoyue_admin_password",
  roles: [
    {
      role: "dbOwner",
      db: "haoyue"
    }
  ]
});

// 创建索引
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.stocks.createIndex({ symbol: 1 }, { unique: true });
db.stocks.createIndex({ name: "text", symbol: "text" });
db.analyses.createIndex({ userId: 1, createdAt: -1 });
db.analyses.createIndex({ stockSymbol: 1, createdAt: -1 });
db.recommendations.createIndex({ userId: 1, createdAt: -1 });

// 插入测试数据
db.stocks.insertMany([
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    exchange: "NASDAQ",
    sector: "Technology",
    industry: "Consumer Electronics",
    marketCap: 2500000000000,
    latestPrice: 180.50,
    change: 2.30,
    changePercent: 1.29,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    exchange: "NASDAQ",
    sector: "Technology",
    industry: "Software",
    marketCap: 2200000000000,
    latestPrice: 330.75,
    change: 1.50,
    changePercent: 0.46,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    exchange: "NASDAQ",
    sector: "Technology",
    industry: "Internet Content & Information",
    marketCap: 1600000000000,
    latestPrice: 125.30,
    change: -0.75,
    changePercent: -0.60,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// 创建系统管理员用户
db.users.insertOne({
  username: "admin",
  email: "admin@haoyuequant.com",
  password: "$2a$10$EixZaYb4xU58Gpq1R0yW8eP0lGd3Gd3Gd3Gd3Gd3Gd3Gd3Gd3Gd3Gd", // admin123
  name: "系统管理员",
  role: "admin",
  status: "active",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print("MongoDB初始化完成！");