package com.example.demo.dto;

public class ChatResponse {

    private String conversationId;

    private String reply;

    public ChatResponse() {
    }

    public ChatResponse(String conversationId, String reply) {
        this.conversationId = conversationId;
        this.reply = reply;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }
}
