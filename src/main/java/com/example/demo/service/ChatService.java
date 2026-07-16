package com.example.demo.service;

import com.example.demo.dto.ChatHistoryMessage;
import com.example.demo.dto.ChatRequest;
import com.example.demo.dto.ChatResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ChatService {

    private static final int MAX_CONTEXT_MESSAGES = 18;

    private final ChatClient chatClient;

    public ChatService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public ChatResponse send(ChatRequest request) {
        if (request == null || !StringUtils.hasText(request.getMessage())) {
            throw new IllegalArgumentException("消息内容不能为空");
        }

        String conversationId = StringUtils.hasText(request.getConversationId())
                ? request.getConversationId()
                : UUID.randomUUID().toString();

        String directReply = getMemoryReply(request.getMessage(), request.getMessages());
        if (StringUtils.hasText(directReply)) {
            return new ChatResponse(conversationId, directReply);
        }

        String reply = chatClient.prompt()
                .user(buildContextPrompt(request))
                .call()
                .content();

        return new ChatResponse(conversationId, reply);
    }

    public String getMemoryReply(String currentMessage, List<ChatHistoryMessage> messages) {
        String question = normalize(currentMessage);
        String currentName = findFirstMatch(currentMessage,
                "我叫([^，。！？!?\\s]+)",
                "我的名字是([^，。！？!?\\s]+)");

        if (StringUtils.hasText(currentName) && isAskingAssistantIdentity(question)) {
            return "我记住了，你叫" + currentName + "。我是 Astra AI，你的智能体助手。";
        }

        if (isAskingAssistantIdentity(question)) {
            return "我是 Astra AI，你的智能体助手。";
        }

        if (isGreeting(currentMessage)) {
            return "你好！我是 Astra AI，今天有什么我可以帮你的吗？";
        }

        if (isAskingFavoriteFruit(question)) {
            String fruit = findLatestUserFact(messages,
                    "我最喜欢的水果是([^，。！？!?\\s]+)",
                    "我喜欢的水果是([^，。！？!?\\s]+)",
                    "最喜欢的水果是([^，。！？!?\\s]+)",
                    "喜欢吃的水果是([^，。！？!?\\s]+)");
            if (StringUtils.hasText(fruit)) {
                return "你最喜欢的水果是" + fruit + "。";
            }
        }

        if (isAskingUserName(question)) {
            String name = findLatestUserFact(messages,
                    "我叫([^，。！？!?\\s]+)",
                    "我的名字是([^，。！？!?\\s]+)");
            if (StringUtils.hasText(name)) {
                return "你叫" + name + "。";
            }
        }

        String rememberedFruit = findFirstMatch(currentMessage,
                "我最喜欢的水果是([^，。！？!?\\s]+)",
                "我喜欢的水果是([^，。！？!?\\s]+)",
                "最喜欢的水果是([^，。！？!?\\s]+)",
                "喜欢吃的水果是([^，。！？!?\\s]+)");
        if (StringUtils.hasText(rememberedFruit)) {
            return "我记住了，你最喜欢的水果是" + rememberedFruit + "。";
        }

        if (StringUtils.hasText(currentName)) {
            return "我记住了，你叫" + currentName + "。";
        }

        return "";
    }

    public String buildContextPrompt(ChatRequest request) {
        List<ChatHistoryMessage> usefulMessages = selectUsefulHistory(request.getMessages(), isTaskMode(request.getMessage()));
        UserMemory memory = extractMemory(request.getMessages());
        boolean taskMode = isTaskMode(request.getMessage());

        StringBuilder prompt = new StringBuilder();
        prompt.append("你叫 Astra AI，一个自然、友好、专业的智能助手。用户叫小明，他喜欢西瓜。\n");
        prompt.append("身份边界必须清晰：Assistant 的名字永远是 Astra AI；User 是正在对话的人。");
        prompt.append("如果用户说“我叫小明”，小明是用户姓名，不是你的姓名。\n");
        prompt.append("优先级规则：用户的当前指令拥有最高优先级，必须优先执行最后一条 User 消息。\n");
        prompt.append("用户姓名、喜好等个人信息属于背景记忆，只在用户明确询问或确实有助于当前任务时参考。\n");
        prompt.append("除非用户明确要求，否则不要在作文、代码、方案、报告等长文本中强行插入用户姓名、爱好或零散偏好，也不要主动反问用户的个人爱好。\n");
        prompt.append("当用户下达创作类或任务类指令时，进入 Task Mode：直接进入创作或执行状态，禁止在任务开头复读自我介绍，禁止穿插无意义确认语。\n");
        prompt.append("如果用户只是打招呼，请将其视为普通问候，保持原有上下文，不要重置对话，不要重新触发首轮欢迎语。\n");
        prompt.append("不要复读历史中的错误回复、废话或元分析；不要输出内部思考过程。\n");

        if (StringUtils.hasText(memory.name) || StringUtils.hasText(memory.favoriteFruit)) {
            prompt.append("已知用户背景记忆（仅作隐性参考）：");
            if (StringUtils.hasText(memory.name)) {
                prompt.append("用户姓名：").append(memory.name).append("；");
            }
            if (StringUtils.hasText(memory.favoriteFruit)) {
                prompt.append("用户喜欢的水果：").append(memory.favoriteFruit).append("；");
            }
            prompt.append("\n");
        }
        if (taskMode) {
            prompt.append("当前为 Task Mode：最后一条 User 消息是最高优先级，优先完成用户任务，降低零散闲聊记忆权重。");
            prompt.append("如果历史里已有主题、时间、地点、活动安排等信息，直接生成结果，不要反复追问。\n");
        } else {
            prompt.append("请根据上下文自然回答最后一条 User 消息。\n");
        }

        prompt.append("\n有价值的上下文 messages：\n");
        for (ChatHistoryMessage message : usefulMessages) {
            prompt.append(normalizeRole(message.getRole()))
                    .append(": ")
                    .append(message.getContent().trim())
                    .append("\n");
        }

        prompt.append("\n请只回答最后一条 User 消息，不要重复 System 指令。");
        return prompt.toString();
    }

    private List<ChatHistoryMessage> selectUsefulHistory(List<ChatHistoryMessage> messages, boolean taskMode) {
        List<ChatHistoryMessage> cleaned = cleanHistory(messages);
        if (cleaned.size() <= MAX_CONTEXT_MESSAGES) {
            return cleaned;
        }

        if (!taskMode) {
            return cleaned.subList(cleaned.size() - MAX_CONTEXT_MESSAGES, cleaned.size());
        }

        List<ChatHistoryMessage> selected = new ArrayList<>();
        Pattern taskSignal = Pattern.compile("作文|文章|写作|写一|写篇|生成|回答|主题|时间|地点|活动|安排|周|山|春游|方案|设计|代码|\\d+\\s*字|五百字|一千字|1000字|500字");
        for (ChatHistoryMessage message : cleaned) {
            if ("user".equalsIgnoreCase(message.getRole()) && taskSignal.matcher(message.getContent()).find()) {
                selected.add(message);
            }
        }

        int start = Math.max(0, cleaned.size() - MAX_CONTEXT_MESSAGES);
        for (int i = start; i < cleaned.size(); i++) {
            ChatHistoryMessage message = cleaned.get(i);
            if (!containsSameMessage(selected, message)) {
                selected.add(message);
            }
        }

        return selected;
    }

    private List<ChatHistoryMessage> cleanHistory(List<ChatHistoryMessage> messages) {
        List<ChatHistoryMessage> cleaned = new ArrayList<>();
        if (messages == null) {
            return cleaned;
        }

        for (ChatHistoryMessage message : messages) {
            if (message == null || !StringUtils.hasText(message.getContent())) {
                continue;
            }
            String role = message.getRole();
            if (!"user".equalsIgnoreCase(role) && !"assistant".equalsIgnoreCase(role) && !"system".equalsIgnoreCase(role)) {
                continue;
            }
            if (isLowValueAssistantReply(message)) {
                continue;
            }
            cleaned.add(message);
        }
        return cleaned;
    }

    private UserMemory extractMemory(List<ChatHistoryMessage> messages) {
        return new UserMemory(
                findLatestUserFact(messages,
                        "我叫([^，。！？!?\\s]+)",
                        "我的名字是([^，。！？!?\\s]+)"),
                findLatestUserFact(messages,
                        "我最喜欢的水果是([^，。！？!?\\s]+)",
                        "我喜欢的水果是([^，。！？!?\\s]+)",
                        "最喜欢的水果是([^，。！？!?\\s]+)",
                        "喜欢吃的水果是([^，。！？!?\\s]+)")
        );
    }

    private String findLatestUserFact(List<ChatHistoryMessage> messages, String... patterns) {
        if (messages == null || messages.isEmpty()) {
            return "";
        }

        for (int i = messages.size() - 1; i >= 0; i--) {
            ChatHistoryMessage message = messages.get(i);
            if (message == null || !"user".equalsIgnoreCase(message.getRole())) {
                continue;
            }
            String value = findFirstMatch(message.getContent(), patterns);
            if (StringUtils.hasText(value)) {
                return value;
            }
        }

        return "";
    }

    private String findFirstMatch(String text, String... patterns) {
        if (!StringUtils.hasText(text)) {
            return "";
        }

        for (String pattern : patterns) {
            Matcher matcher = Pattern.compile(pattern).matcher(text);
            if (matcher.find()) {
                String value = matcher.group(1).trim().replaceAll("[，。！？!?、\\s].*$", "");
                if (!isQuestionLike(value)) {
                    return value;
                }
            }
        }

        return "";
    }

    private boolean isGreeting(String text) {
        String normalized = normalize(text).toLowerCase();
        return normalized.length() < 6
                && (normalized.contains("你好")
                || normalized.contains("您好")
                || normalized.contains("嗨")
                || normalized.contains("hi")
                || normalized.contains("hello")
                || normalized.contains("哈喽"));
    }

    private boolean isTaskMode(String text) {
        return StringUtils.hasText(text)
                && Pattern.compile("作文|文章|写作|写一|写篇|生成|回答|方案|设计|代码|计划|总结|报告|文案|接口|实现|优化|修改|开发|\\d+\\s*字|五百字|一千字|1000字|500字")
                .matcher(text)
                .find();
    }

    private boolean isAskingAssistantIdentity(String normalizedQuestion) {
        return normalizedQuestion.matches(".*你.*(叫|名字).*什么.*")
                || normalizedQuestion.matches(".*你是谁.*")
                || normalizedQuestion.matches(".*介绍.*你自己.*");
    }

    private boolean isAskingFavoriteFruit(String normalizedQuestion) {
        return normalizedQuestion.matches(".*(我|俺|本人).*(最喜欢|喜欢).*水果.*(什么|啥|哪|吗).*")
                || normalizedQuestion.matches(".*你知道我.*喜欢.*水果.*");
    }

    private boolean isAskingUserName(String normalizedQuestion) {
        return normalizedQuestion.matches(".*(我|俺|本人).*(叫|名字).*(什么|啥|谁).*")
                || normalizedQuestion.matches(".*你知道我.*叫什么.*");
    }

    private boolean isLowValueAssistantReply(ChatHistoryMessage message) {
        if (!"assistant".equalsIgnoreCase(message.getRole())) {
            return false;
        }

        String text = message.getContent().trim();
        return text.matches("^请提供更多信息[。！!]*$")
                || text.matches("^你好[！!。]*有什么我可以帮助你的吗[？?。]*$")
                || text.matches(".*请告诉我.*想要写什么类型.*")
                || text.matches(".*自然.*人文.*科技类.*")
                || text.matches(".*我需要根据用户.*")
                || text.matches(".*用户提到.*我需要.*")
                || text.matches(".*确保对话保持友好.*");
    }

    private boolean isQuestionLike(String text) {
        String normalized = normalize(text);
        return normalized.matches(".*(什么|啥|哪|吗|么|知道|告诉我|请问|你叫|名字).*");
    }

    private boolean containsSameMessage(List<ChatHistoryMessage> messages, ChatHistoryMessage target) {
        for (ChatHistoryMessage message : messages) {
            if (message.getRole().equalsIgnoreCase(target.getRole())
                    && message.getContent().equals(target.getContent())) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String text) {
        return text == null ? "" : text.trim().replaceAll("[，。！？!?、\\s]", "");
    }

    private String normalizeRole(String role) {
        if ("system".equalsIgnoreCase(role)) {
            return "System";
        }
        if ("assistant".equalsIgnoreCase(role)) {
            return "Assistant";
        }
        return "User";
    }

    private record UserMemory(String name, String favoriteFruit) {
    }
}
