package com.example.demo.service;

import com.example.demo.dto.ChatRequest;
import com.example.demo.dto.ChatStreamStartResponse;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.Disposable;

@Service
public class ChatStreamService {

    private final ChatClient chatClient;

    private final ChatService chatService;

    private final Map<String, ChatRequest> pendingStreams = new ConcurrentHashMap<>();

    public ChatStreamService(ChatClient.Builder chatClientBuilder, ChatService chatService) {
        this.chatClient = chatClientBuilder.build();
        this.chatService = chatService;
    }

    public ChatStreamStartResponse start(ChatRequest request) {
        if (request == null || !StringUtils.hasText(request.getMessage())) {
            throw new IllegalArgumentException("消息内容不能为空");
        }

        String streamId = UUID.randomUUID().toString();
        String conversationId = StringUtils.hasText(request.getConversationId())
                ? request.getConversationId()
                : UUID.randomUUID().toString();
        request.setConversationId(conversationId);
        pendingStreams.put(streamId, request);
        return new ChatStreamStartResponse(streamId, conversationId);
    }

    public SseEmitter stream(String streamId) {
        ChatRequest request = pendingStreams.remove(streamId);
        SseEmitter emitter = new SseEmitter(0L);

        if (request == null) {
            completeWithError(emitter, "流式会话不存在或已过期");
            return emitter;
        }

        String directReply = chatService.getMemoryReply(request.getMessage(), request.getMessages());
        if (StringUtils.hasText(directReply)) {
            send(emitter, "message", directReply);
            send(emitter, "done", "[DONE]");
            emitter.complete();
            return emitter;
        }

        Disposable disposable = chatClient.prompt()
                .user(chatService.buildContextPrompt(request))
                .stream()
                .content()
                .subscribe(
                        chunk -> send(emitter, "message", chunk),
                        emitter::completeWithError,
                        () -> {
                            send(emitter, "done", "[DONE]");
                            emitter.complete();
                        }
                );

        emitter.onCompletion(disposable::dispose);
        emitter.onTimeout(disposable::dispose);
        emitter.onError(error -> disposable.dispose());

        return emitter;
    }

    private void send(SseEmitter emitter, String eventName, String data) {
        try {
            emitter.send(SseEmitter.event().name(eventName).data(data == null ? "" : data));
        } catch (IOException ex) {
            emitter.completeWithError(ex);
        }
    }

    private void completeWithError(SseEmitter emitter, String message) {
        send(emitter, "server-error", message);
        emitter.complete();
    }
}
