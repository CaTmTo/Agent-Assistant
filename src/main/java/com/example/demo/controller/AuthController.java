package com.example.demo.controller;

import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.UserResponse;
import com.example.demo.service.UserService;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        try {
            UserResponse user = userService.login(request.getAccount(), request.getPassword());
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("success", true);
            body.put("message", "登录成功");
            body.put("user", user);
            return ResponseEntity.ok(body);
        } catch (IllegalArgumentException ex) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("success", false);
            body.put("message", ex.getMessage());
            return ResponseEntity.badRequest().body(body);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        try {
            UserResponse user = userService.register(
                    request.getUsername(),
                    request.getEmail(),
                    request.getPassword()
            );
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("success", true);
            body.put("message", "注册成功");
            body.put("user", user);
            return ResponseEntity.ok(body);
        } catch (IllegalArgumentException ex) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("success", false);
            body.put("message", ex.getMessage());
            return ResponseEntity.badRequest().body(body);
        } catch (RuntimeException ex) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("success", false);
            body.put("message", ex.getMessage());
            return ResponseEntity.status(500).body(body);
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validate(@RequestBody Map<String, Long> request) {
        Long userId = request.get("id");
        if (userId == null) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("valid", false);
            return ResponseEntity.ok(body);
        }

        boolean exists = userService.existsById(userId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("valid", exists);
        return ResponseEntity.ok(body);
    }
}