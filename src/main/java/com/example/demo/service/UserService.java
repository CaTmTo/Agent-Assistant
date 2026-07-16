package com.example.demo.service;

import com.example.demo.dto.UserResponse;
import com.example.demo.entity.User;
import com.example.demo.mapper.UserMapper;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserMapper userMapper;

    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    public UserResponse login(String account, String password) {
        if (!StringUtils.hasText(account) || !StringUtils.hasText(password)) {
            throw new IllegalArgumentException("账号和密码不能为空");
        }

        try {
            User user = userMapper.selectByAccountAndPassword(account.trim(), password);
            if (user == null) {
                throw new IllegalArgumentException("账号或密码错误");
            }
            logger.info("用户登录成功: username={}, email={}", user.getUsername(), user.getEmail());
            return UserResponse.from(user);
        } catch (Exception e) {
            logger.error("登录失败: account={}, error={}", account, e.getMessage());
            throw e;
        }
    }

    @Transactional
    public UserResponse register(String username, String email, String password) {
        if (!StringUtils.hasText(username)) {
            throw new IllegalArgumentException("用户名不能为空");
        }
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("邮箱不能为空");
        }
        if (!StringUtils.hasText(password)) {
            throw new IllegalArgumentException("密码不能为空");
        }
        if (password.length() < 6) {
            throw new IllegalArgumentException("密码长度不能少于6位");
        }

        try {
            User existingUser = userMapper.selectOne(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<User>()
                    .eq(User::getEmail, email)
                    .last("LIMIT 1"));
            if (existingUser != null) {
                throw new IllegalArgumentException("该邮箱已被注册");
            }

            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(password);

            int result = userMapper.insert(user);
            if (result <= 0) {
                throw new RuntimeException("注册失败，请重试");
            }

            logger.info("用户注册成功: username={}, email={}", username, email);
            return UserResponse.from(user);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            logger.error("注册失败: username={}, email={}, error={}", username, email, e.getMessage());
            throw new RuntimeException("注册失败，请稍后重试");
        }
    }

    public boolean existsById(Long id) {
        if (id == null) {
            return false;
        }
        return userMapper.selectById(id) != null;
    }

    public List<UserResponse> listUsers() {
        return userMapper.selectList(null)
                .stream()
                .map(UserResponse::from)
                .toList();
    }
}
