package com.example.demo.mapper;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.demo.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {

    default User selectByUsernameAndPassword(String username, String password) {
        // BCrypt upgrade: query by username first, then verify with BCryptPasswordEncoder.matches.
        return selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username)
                .eq(User::getPassword, password)
                .last("LIMIT 1"));
    }

    default User selectByAccountAndPassword(String account, String password) {
        // BCrypt upgrade: query by username/email first, then verify the password hash.
        return selectOne(new LambdaQueryWrapper<User>()
                .and(wrapper -> wrapper
                        .eq(User::getUsername, account)
                        .or()
                        .eq(User::getEmail, account))
                .eq(User::getPassword, password)
                .last("LIMIT 1"));
    }
}
