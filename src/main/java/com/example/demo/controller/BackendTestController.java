package com.example.demo.controller;

import com.example.demo.dto.UserResponse;
import com.example.demo.service.AiTestService;
import com.example.demo.service.UserService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BackendTestController {

    private final AiTestService aiTestService;

    private final UserService userService;

    public BackendTestController(AiTestService aiTestService, UserService userService) {
        this.aiTestService = aiTestService;
        this.userService = userService;
    }

    @GetMapping({"/test", "/api/test/ai"})
    public String testAi() {
        return aiTestService.introduceModel();
    }

    @GetMapping({"/login", "/api/test/users"})
    public List<UserResponse> listUsers() {
        return userService.listUsers();
    }
}
