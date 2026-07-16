# Astra AI - 智能对话助手

一款基于 Spring Boot + React 技术栈构建的智能对话助手平台。

## ✨ 功能特性

- **智能对话系统**：支持与 AI 助手进行自然语言交互，提供实习周报、架构规划等快捷指令
- **用户鉴权模块**：独立的登录/注册页面，支持邮箱和密码验证，登录状态持久化存储
- **动态视觉效果**：基于 Canvas 实现的粒子动态背景，配合毛玻璃效果打造沉浸式科技感界面
- **流式响应**：支持 AI 对话的流式输出，提升用户体验
- **本地 AI 部署**：集成 Ollama，支持本地运行 AI 模型

## 🛠 技术栈

### 后端
- **框架**: Spring Boot 3.5.14
- **语言**: Java 17
- **数据库**: MySQL + MyBatis-Plus 3.5.16
- **AI 集成**: Spring AI 1.1.6 + Ollama

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **动画**: Framer Motion

## 📁 项目结构

```
├── demo/                    # 后端 Spring Boot 项目
│   ├── src/main/java/com/example/demo/
│   │   ├── controller/      # REST API 控制器
│   │   │   ├── AuthController.java        # 用户认证接口
│   │   │   ├── ChatController.java        # 聊天接口
│   │   │   └── ChatStreamController.java  # 流式聊天接口
│   │   ├── service/         # 业务逻辑层
│   │   │   ├── UserService.java           # 用户服务
│   │   │   ├── ChatService.java           # 聊天服务
│   │   │   └── ChatStreamService.java     # 流式聊天服务
│   │   ├── mapper/          # MyBatis 映射器
│   │   ├── entity/          # 数据库实体
│   │   └── dto/             # 数据传输对象
│   └── src/main/resources/
│       ├── application.properties         # 应用配置
│       └── static/          # 前端静态资源
│           ├── login.html   # 独立登录页面
│           ├── js/          # JavaScript 脚本
│           └── css/         # 样式文件
└── portal/                  # 前端 React 项目
    ├── src/
    │   ├── components/      # React 组件
    │   └── hooks/           # 自定义 Hooks
    └── dist/                # 构建产物
```

## 🚀 快速开始

### 前置条件

- JDK 17+
- Maven 3.8+
- MySQL 8.0+
- Node.js 18+
- Ollama (本地 AI 模型运行时)

### 1. 安装 Ollama 并拉取模型

```bash
# 安装 Ollama (根据操作系统)
# 官网: https://ollama.com/

# 拉取 deepseek-r1 模型
ollama pull deepseek-r1:1.5b

# 启动 Ollama 服务
ollama serve
```

### 2. 创建数据库

```sql
CREATE DATABASE demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE demo;

CREATE TABLE user (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(20) NOT NULL,
  email VARCHAR(50) NOT NULL,
  password VARCHAR(20) NOT NULL
);
```

### 3. 配置数据库连接

修改 `src/main/resources/application.properties`：

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/demo?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=142857
```

### 4. 构建前端

```bash
cd portal
npm install
npm run build

# 构建产物将自动复制到后端 static 目录
```

### 5. 运行后端

```bash
# 使用 Maven 运行
mvn spring-boot:run

# 或打包后运行
mvn clean package
java -jar target/zhinnegzhushou-0.0.1-SNAPSHOT.jar
```

### 6. 访问应用

- **登录页面**: http://localhost:8083/login.html
- **主页面**: http://localhost:8083/index.html

## 🔌 API 接口

### 用户认证

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/login` | 用户登录 |
| POST | `/api/register` | 用户注册 |

### 聊天功能

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/chat` | 发送消息 |
| POST | `/api/chat/stream` | 流式消息响应 |

## ⚙️ 配置说明

### AI 模型配置

```properties
# Ollama 服务地址
spring.ai.ollama.base-url=http://localhost:11434

# 使用的模型
spring.ai.ollama.chat.options.model=deepseek-r1:1.5b

# 温度参数 (0-1, 越高越随机)
spring.ai.ollama.chat.options.temperature=0.7

# 最大生成 tokens
spring.ai.ollama.chat.options.max-tokens=1000
```

## 📄 License

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！