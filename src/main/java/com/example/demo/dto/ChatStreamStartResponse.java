package com.example.demo.dto;

public class ChatStreamStartResponse {

    private String streamId;

    private String conversationId;

    public ChatStreamStartResponse() {
    }

    public ChatStreamStartResponse(String streamId, String conversationId) {
        this.streamId = streamId;
        this.conversationId = conversationId;
    }

    public String getStreamId() {
        return streamId;
    }

    public void setStreamId(String streamId) {
        this.streamId = streamId;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }
}
