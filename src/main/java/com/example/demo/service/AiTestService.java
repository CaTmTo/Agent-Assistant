package com.example.demo.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class AiTestService {

    private final ChatClient chatClient;

    public AiTestService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public String introduceModel() {
        return chatClient.prompt()
                .user("介绍一下你自己")
                .call()
                .content();
    }
}
