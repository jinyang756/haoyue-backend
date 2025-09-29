const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '请提供用户名'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [20, '用户名最多20个字符']
  },
  email: {
    type: String,
    required: [true, '请提供邮箱'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      '请提供有效的邮箱地址'
    ]
  },
  password: {
    type: String,
    required: [true, '请提供密码'],
    minlength: [6, '密码至少6个字符'],
    select: false
  },
  name: {
    type: String,
    trim: true,
    maxlength: [50, '姓名最多50个字符']
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  role: {
    type: String,
    enum: ['user', 'vip', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  preferences: {
    darkMode: {
      type: Boolean,
      default: false
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    favoriteStocks: [{
      type: String,
      trim: true
    }]
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    expiresAt: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  lastLogin: {
    type: Date
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 密码加密中间件
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 生成JWT Token
UserSchema.methods.generateToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// 生成刷新Token
UserSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );
};

// 验证密码
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 虚拟字段：计算用户注册天数
UserSchema.virtual('daysRegistered').get(function() {
  const today = new Date();
  const registerDate = new Date(this.createdAt);
  const diffTime = Math.abs(today - registerDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// 查询中间件：默认查询活跃用户
UserSchema.pre(/^find/, function(next) {
  this.find({ status: { $ne: 'banned' } });
  next();
});

// 更新最后登录时间
UserSchema.methods.updateLastLogin = async function() {
  this.lastLogin = Date.now();
  await this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('User', UserSchema);