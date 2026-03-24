/**
 * Centralized i18n string definitions.
 * All UI text lives here — no translated strings should be scattered in source files.
 *
 * Each export is a zero-arg or n-arg function so that language is resolved at
 * call-time (the .tray-lang file may change while the bot is running).
 */
import { L } from "../utils/i18n.js";

// ─────────────────────────────────────────────
// session-manager.ts
// ─────────────────────────────────────────────
export const s_thinkingEmoji      = () => L("⏳ Thinking...",      "⏳ 思考中...",          "⏳ 생각 중...");
export const s_thinking           = () => L("Thinking...",         "思考中...",             "생각 중...");
export const s_readingFiles       = () => L("Reading files",       "读取文件",              "파일 읽는 중");
export const s_searchingFiles     = () => L("Searching files",     "搜索文件",              "파일 검색 중");
export const s_searchingCode      = () => L("Searching code",      "搜索代码",              "코드 검색 중");
export const s_writingFile        = () => L("Writing file",        "写入文件",              "파일 작성 중");
export const s_editingFile        = () => L("Editing file",        "编辑文件",              "파일 편집 중");
export const s_runningCommand     = () => L("Running command",     "执行命令",              "명령어 실행 중");
export const s_searchingWeb       = () => L("Searching web",       "搜索网络",              "웹 검색 중");
export const s_fetchingUrl        = () => L("Fetching URL",        "获取 URL",              "URL 가져오는 중");
export const s_updatingTasks      = () => L("Updating tasks",      "更新任务",              "작업 업데이트 중");
export const s_questionTimedOut   = () => L("Question timed out",  "问题已超时",            "질문 시간 초과");
export const s_done               = () => L("Done.",               "完成。",               "완료.");
export const s_taskCompleted      = () => L("Task completed",      "任务完成",              "작업 완료");

export const s_processingQueued = (remaining: number, preview: string) =>
  L(
    `📨 Processing queued message... (remaining: ${remaining})\n> ${preview}`,
    `📨 正在处理排队消息... (剩余: ${remaining})\n> ${preview}`,
    `📨 대기 중이던 메시지를 처리합니다... (남은 큐: ${remaining}개)\n> ${preview}`,
  );
export const s_processingQueuedNoCount = (preview: string) =>
  L(
    `📨 Processing queued message...\n> ${preview}`,
    `📨 正在处理排队消息...\n> ${preview}`,
    `📨 대기 중이던 메시지를 처리합니다...\n> ${preview}`,
  );

// ─────────────────────────────────────────────
// output-formatter.ts
// ─────────────────────────────────────────────
export const s_truncated          = () => L("... (truncated)",         "... (已截断)",          "... (잘림)");
export const s_stop               = () => L("Stop",                    "停止",                  "중지");
export const s_completed          = () => L("Completed",               "已完成",                "완료됨");
export const s_autoApprove        = (toolName: string) => L(`✅ Auto: ${toolName}`,       `✅ 自动批准: ${toolName}`,   `✅ 자동 승인: ${toolName}`);
export const s_toolUse            = (toolName: string) => L(`🔧 Tool Use: ${toolName}`,   `🔧 工具调用: ${toolName}`,   `🔧 도구 사용: ${toolName}`);
export const s_file               = () => L("File",                    "文件",                  "파일");
export const s_changes            = () => L("Changes",                 "变更内容",              "변경 사항");
export const s_contentPreview     = () => L("Content Preview",         "内容预览",              "내용 미리보기");
export const s_command            = () => L("Command",                 "命令",                  "명령어");
export const s_description        = () => L("Description",             "说明",                  "설명");
export const s_input              = () => L("Input",                   "输入",                  "입력");
export const s_approve            = () => L("Approve",                 "批准",                  "승인");
export const s_deny               = () => L("Deny",                    "拒绝",                  "거부");
export const s_autoApproveAll     = () => L("Auto-approve All",        "全部自动批准",           "모두 자동 승인");
export const s_selectOptions      = () => L("Select options...",       "请选择选项...",          "옵션을 선택하세요...");
export const s_customInput        = () => L("Custom input",            "自定义输入",             "직접 입력");
export const s_costEst            = () => L("Cost (est.)",             "费用（估算）",           "비용 (추정)");
export const s_duration           = () => L("Duration",                "耗时",                  "소요 시간");
export const s_taskCompleteEmoji  = () => L("✅ Task Complete",        "✅ 任务完成",            "✅ 작업 완료");
export const s_taskCompleteTitle  = () => L("Task Complete",           "任务完成",              "작업 완료");

// ─────────────────────────────────────────────
// commands/cmd.ts
// ─────────────────────────────────────────────
export const s_cmdDescription     = () => L("Run a shell command in the workspace", "在工作区执行 Shell 命令", "워크스페이스에서 셸 명령어 실행");
export const s_channelNotReg      = () => L("This channel is not registered. Use `/register` first.", "此频道尚未注册，请先使用 `/register`。", "이 채널은 등록되지 않았습니다. 먼저 `/register`를 사용하세요.");

// ─────────────────────────────────────────────
// commands/sync-config.ts
// ─────────────────────────────────────────────
export const s_syncConfigDescription = () =>
  L(
    "Sync Claude configuration from the config workspace to this channel's workspace",
    "从配置工作区同步 Claude 配置到当前频道配对的工作区",
    "설정 워크스페이스에서 현재 채널 워크스페이스로 Claude 설정을 동기화합니다",
  );
export const s_syncConfigNoConfigWorkspace = () =>
  L(
    "❌ No source workspace specified. Either pass the `workspace` option or set `CODER_CONFIG_WORKSPACE` in your `.env` file.",
    "❌ 未指定来源工作空间。请通过 `workspace` 参数指定，或在 `.env` 文件中设置 `CODER_CONFIG_WORKSPACE`。",
    "❌ 소스 워크스페이스가 지정되지 않았습니다. `workspace` 옵션을 전달하거나 `.env` 파일에서 `CODER_CONFIG_WORKSPACE`를 설정하세요.",
  );
export const s_syncConfigWorkspaceOptionDescription = () =>
  L(
    "Source workspace to sync config from (overrides CODER_CONFIG_WORKSPACE)",
    "要同步配置的来源工作空间（覆盖 CODER_CONFIG_WORKSPACE 环境变量）",
    "설정을 동기화할 소스 워크스페이스 (CODER_CONFIG_WORKSPACE 환경변수보다 우선함)",
  );
export const s_syncConfigSuccess = (from: string, to: string) =>
  L(
    `✅ Claude configuration synced from \`${from}\` → \`${to}\`.`,
    `✅ 已将 Claude 配置从 \`${from}\` 同步至 \`${to}\`。`,
    `✅ Claude 설정이 \`${from}\`에서 \`${to}\`로 동기화되었습니다.`,
  );
export const s_noOutput           = () => L("*(no output)*",           "*(无输出)*",             "*(출력 없음)*");
export const s_outputTooLong = (lineCount: number, byteCount: number) =>
  L(
    `…output too long (${lineCount} lines, ${byteCount} bytes) — full output attached`,
    `…输出过长（${lineCount} 行，${byteCount} 字节）— 完整内容见附件`,
    `…출력이 너무 깁니다 (${lineCount}줄, ${byteCount}바이트) — 전체 출력 파일 첨부`,
  );

// ─────────────────────────────────────────────
// commands/sessions.ts
// ─────────────────────────────────────────────
export const s_channelNotRegProject = () =>
  L(
    "This channel is not registered to any project. Use `/register` first.",
    "此频道尚未关联任何项目，请先使用 `/register`。",
    "이 채널은 어떤 프로젝트에도 등록되어 있지 않습니다. 먼저 `/register`를 사용하세요.",
  );
export const s_newSessionTitle    = () => L("✨ New Session",           "✨ 新建会话",            "✨ 새 세션");
export const s_noSessionsFound = (projectPath: string) =>
  L(
    `No existing sessions found for \`${projectPath}\`.\nA new session is ready — your next message will start a new conversation.`,
    `未找到 \`${projectPath}\` 的历史会话。\n新会话已就绪 — 发送下一条消息即可开始新对话。`,
    `\`${projectPath}\`에 대한 기존 세션이 없습니다.\n새 세션이 준비되었습니다 — 다음 메시지부터 새로운 대화가 시작됩니다.`,
  );
export const s_createNewSession   = () => L("✨ Create New Session",   "✨ 新建会话",            "✨ 새 세션 만들기");
export const s_createNewSessionDesc = () =>
  L(
    "Start a new conversation without an existing session",
    "不使用历史会话，直接开始新对话",
    "기존 세션 없이 새로운 대화를 시작합니다",
  );
export const s_justNow            = () => L("just now",                "刚刚",                  "방금");
export const s_minutesAgo = (m: number) => L(`${m}m ago`,             `${m} 分钟前`,           `${m}분 전`);
export const s_hoursAgo   = (h: number) => L(`${h}h ago`,             `${h} 小时前`,           `${h}시간 전`);
export const s_daysAgo    = (d: number) => L(`${d}d ago`,             `${d} 天前`,             `${d}일 전`);
export const s_localeName         = () => L("en-US",                   "zh-CN",                 "ko-KR");
export const s_active             = () => L("Active",                  "使用中",                "사용 중");
export const s_selectSession      = () => L("Select a session to resume...", "选择要恢复的会话...", "재개할 세션을 선택하세요...");
export const s_claudeCodeSessions = () => L("Claude Code Sessions",   "Claude Code 会话",      "Claude Code 세션");
export const s_foundSessions = (count: number) =>
  L(`Found **${count}** session(s)`, `找到 **${count}** 个会话`, `**${count}**개의 세션을 찾았습니다`);
export const s_selectSessionBelow = () =>
  L(
    "Select a session below to resume or delete it.",
    "在下方选择一个会话以恢复或删除。",
    "아래에서 세션을 선택하여 재개하거나 삭제하세요.",
  );

// ─────────────────────────────────────────────
// commands/init.ts
// ─────────────────────────────────────────────
export const s_initDescription    = () =>
  L(
    "Create a Coder workspace + Discord channel and register it",
    "创建 Coder 工作区和 Discord 频道并完成注册",
    "Coder 워크스페이스와 Discord 채널을 생성하고 등록합니다",
  );
export const s_categoryOption     = () => L("Category to create the channel in", "创建频道所在的分类", "채널을 생성할 카테고리");
export const s_invalidName        = () =>
  L(
    "Invalid name: must contain at least one alphanumeric character.",
    "名称无效：必须包含至少一个字母或数字字符。",
    "잘못된 이름입니다.",
  );
export const s_templateRequired   = () =>
  L(
    "❌ Template is required when creating a new workspace. Please provide the `template` option.",
    "❌ 创建新工作区时必须指定模板，请提供 `template` 选项。",
    "❌ 새 워크스페이스 생성 시 템플릿이 필요합니다. `template` 옵션을 지정해 주세요.",
  );
export const s_workspaceExists = (name: string) =>
  L(
    `ℹ️ Workspace \`${name}\` already exists. Creating Discord channel...`,
    `ℹ️ 工作区 \`${name}\` 已存在，正在创建 Discord 频道...`,
    `ℹ️ 워크스페이스 \`${name}\`가 이미 존재합니다. Discord 채널 생성 중...`,
  );
export const s_creatingWorkspace = (name: string) =>
  L(
    `⏳ Creating Coder workspace \`${name}\`...`,
    `⏳ 正在创建 Coder 工作区 \`${name}\`...`,
    `⏳ Coder 워크스페이스 \`${name}\` 생성 중...`,
  );
export const s_workspaceCreated = (name: string) =>
  L(
    `✅ Workspace \`${name}\` created. Waiting 2 minutes for initialization...`,
    `✅ 工作区 \`${name}\` 已创建，等待初始化（约 2 分钟）...`,
    `✅ 워크스페이스 \`${name}\` 생성 완료. 초기화 대기 중 (2분)...`,
  );
export const s_syncingCredentials = (configWorkspace: string) =>
  L(
    `🔄 Syncing Claude credentials from \`${configWorkspace}\`...`,
    `🔄 正在从 \`${configWorkspace}\` 同步 Claude 凭据...`,
    `🔄 \`${configWorkspace}\`에서 Claude 인증 정보 동기화 중...`,
  );
export const s_syncFailed = (msg: string) =>
  L(
    `⚠️ Credential sync failed (workspace still registered): ${msg}`,
    `⚠️ 凭据同步失败（工作区已注册）：${msg}`,
    `⚠️ 인증 정보 동기화 실패 (워크스페이스는 등록됨): ${msg}`,
  );
export const s_workspaceRegistered = () => L("✅ Workspace Registered", "✅ 工作区已注册", "✅ 워크스페이스 등록됨");
export const s_linkedExistingWorkspace = (name: string, channelId: string) =>
  L(
    `Linked existing Coder workspace \`${name}\` to <#${channelId}>.`,
    `已将现有 Coder 工作区 \`${name}\` 关联至 <#${channelId}>。`,
    `기존 Coder 워크스페이스 \`${name}\`를 <#${channelId}>에 연결했습니다.`,
  );
export const s_createdAndLinkedWorkspace = (name: string, channelId: string) =>
  L(
    `Created Coder workspace \`${name}\` and linked to <#${channelId}>.`,
    `已创建 Coder 工作区 \`${name}\` 并关联至 <#${channelId}>。`,
    `Coder 워크스페이스 \`${name}\`를 생성하고 <#${channelId}>에 연결했습니다.`,
  );
export const s_status             = () => L("Status",                  "状态",                  "상태");
export const s_autoApproveLabel   = () => L("Auto-approve",            "自动批准",              "자동 승인");
export const s_off                = () => L("Off",                     "关",                    "꺼짐");
export const s_registrationFailed = (msg: string) =>
  L(
    `❌ Registration failed: ${msg}`,
    `❌ 注册失败：${msg}`,
    `❌ 등록 실패: ${msg}`,
  );

// ─────────────────────────────────────────────
// commands/auth-mode.ts
// ─────────────────────────────────────────────
export const s_channelNotRegProject2 = s_channelNotRegProject; // alias
export const s_authMode = (isApiKey: boolean) =>
  L(
    `Auth mode: ${isApiKey ? "API Key" : "Subscription"}`,
    `认证模式：${isApiKey ? "API 密钥" : "订阅"}`,
    `인증 모드: ${isApiKey ? "API 키" : "구독"}`,
  );
export const s_authModeApiKeyDesc = () =>
  L(
    "Claude will use the API key environment variables (ANTHROPIC_AUTH_TOKEN, ANTHROPIC_BASE_URL, etc.) from the .env file.",
    "Claude 将使用 .env 文件中的 API 密钥环境变量（ANTHROPIC_AUTH_TOKEN、ANTHROPIC_BASE_URL 等）。",
    "Claude가 .env 파일의 API 키 환경 변수(ANTHROPIC_AUTH_TOKEN, ANTHROPIC_BASE_URL 등)를 사용합니다.",
  );
export const s_authModeSubscriptionDesc = () =>
  L(
    "Claude will use your subscription login. API key environment variables will be excluded.",
    "Claude 将使用您的订阅登录。API 密钥环境变量将被忽略。",
    "Claude가 구독 로그인을 사용합니다. API 키 환경 변수는 제외됩니다.",
  );

// ─────────────────────────────────────────────
// commands/queue.ts
// ─────────────────────────────────────────────
export const s_channelNotRegProject3 = s_channelNotRegProject; // alias
export const s_noMessagesInQueue  = () => L("No messages in queue.",   "队列中没有消息。",       "큐에 대기 중인 메시지가 없습니다.");
export const s_clearAll           = () => L("Clear All",               "清空全部",              "모두 취소");
export const s_messageQueue = (count: number) =>
  L(`📋 Message Queue (${count})`, `📋 消息队列（${count}）`, `📋 메시지 큐 (${count}개)`);
export const s_queueCleared       = () => L("Queue Cleared",           "队列已清空",            "큐 초기화됨");
export const s_queueClearedDesc = (count: number) =>
  L(
    `Cleared ${count} queued message(s).`,
    `已清空 ${count} 条排队消息。`,
    `${count}개의 대기 중이던 메시지를 취소했습니다.`,
  );

// ─────────────────────────────────────────────
// commands/new-session.ts
// ─────────────────────────────────────────────
export const s_newSessionStarted  = () => L("New Session Started",     "新会话已开始",           "새 세션 시작됨");
export const s_newSessionDesc = (projectPath: string) =>
  L(
    `Fresh session created for \`${projectPath}\`.\nPrevious conversation history has been cleared.`,
    `已为 \`${projectPath}\` 创建新会话。\n历史对话记录已清除。`,
    `\`${projectPath}\`의 새 세션이 생성되었습니다.\n이전 대화 기록이 초기화되었습니다.`,
  );
export const s_authModeLabel      = () => L("Auth mode",               "认证模式",              "인증 모드");
export const s_apiKey             = () => L("API Key",                 "API 密钥",              "API 키");
export const s_subscription       = () => L("Subscription",            "订阅",                  "구독");
export const s_on                 = () => L("On",                      "开",                    "켜짐");

// ─────────────────────────────────────────────
// commands/model.ts
// ─────────────────────────────────────────────
export const s_modelDescription   = () => L("Set the Claude model for this channel", "设置此频道的 Claude 模型", "이 채널의 Claude 모델을 설정합니다");
export const s_channelNotRegProject4 = s_channelNotRegProject; // alias
export const s_modelSubscriptionOnly = () =>
  L(
    "Model selection is only available in subscription mode. Switch with `/auth-mode` first.",
    "模型选择仅在订阅模式下可用，请先通过 `/auth-mode` 切换。",
    "모델 선택은 구독 모드에서만 사용할 수 있습니다. 먼저 `/auth-mode`로 전환하세요.",
  );
export const s_unknownModel = (model: string, available: string) =>
  L(
    `Unknown model \`${model}\`. Available: ${available}`,
    `未知模型 \`${model}\`，可用模型：${available}`,
    `알 수 없는 모델 \`${model}\`. 사용 가능: ${available}`,
  );
export const s_modelSet = (shortName: string) => L(`Model: ${shortName}`, `模型：${shortName}`, `모델: ${shortName}`);
export const s_modelSetDesc = (model: string) =>
  L(
    `This channel will now use \`${model}\`. The change takes effect on the next message.`,
    `此频道将使用 \`${model}\`，下一条消息起生效。`,
    `이 채널은 이제 \`${model}\`을 사용합니다. 다음 메시지부터 적용됩니다.`,
  );

// ─────────────────────────────────────────────
// commands/usage.ts
// ─────────────────────────────────────────────
export const s_claudeUsageTitle   = () => L("Claude Subscription Usage", "Claude 订阅用量",      "Claude 구독 사용량");
export const s_noUsageData        = () => L("No usage data returned.",   "未返回用量数据。",       "사용량 데이터가 없습니다.");
export const s_usageDescription   = () =>
  L(
    "Show Claude subscription usage (subscription mode only)",
    "查看 Claude 订阅用量（仅订阅模式）",
    "Claude 구독 사용량 확인 (구독 모드 전용)",
  );
export const s_channelNotRegUsage = () =>
  L(
    "This channel is not registered. Use `/register` first.",
    "此频道尚未注册，请先使用 `/register`。",
    "이 채널은 등록되지 않았습니다. 먼저 `/register`를 사용하세요.",
  );
export const s_usageApiKeyMode    = () =>
  L(
    "⚠️ The `/usage` command is only available in **subscription** mode. This channel uses API key mode.",
    "⚠️ `/usage` 命令仅在**订阅**模式下可用，此频道使用的是 API 密钥模式。",
    "⚠️ `/usage` 명령은 **구독** 모드에서만 사용할 수 있습니다. 이 채널은 API 키 모드입니다.",
  );
export const s_noAccessToken      = () =>
  L(
    "❌ Could not find `accessToken` in `~/.claude/.credentials.json`. Make sure you are logged in with `claude login`.",
    "❌ 在 `~/.claude/.credentials.json` 中未找到 `accessToken`，请确认已通过 `claude login` 登录。",
    "❌ `~/.claude/.credentials.json`에서 `accessToken`을 찾을 수 없습니다. `claude login`으로 로그인되어 있는지 확인하세요.",
  );
export const s_fetchUsageFailed = (msg: string) =>
  L(
    `❌ Failed to fetch usage: ${msg}`,
    `❌ 获取用量失败：${msg}`,
    `❌ 사용량 조회 실패: ${msg}`,
  );

// ─────────────────────────────────────────────
// commands/auto-approve.ts
// ─────────────────────────────────────────────
export const s_channelNotRegProject5 = s_channelNotRegProject; // alias
export const s_autoApproveStatus = (enabled: boolean) =>
  L(
    `Auto-approve: ${enabled ? "ON" : "OFF"}`,
    `自动批准：${enabled ? "开" : "关"}`,
    `자동 승인: ${enabled ? "ON" : "OFF"}`,
  );
export const s_autoApproveOnDesc  = () =>
  L(
    "Claude will automatically approve all tool uses (Edit, Write, Bash, etc.)",
    "Claude 将自动批准所有工具调用（Edit、Write、Bash 等）。",
    "Claude가 모든 도구 사용을 자동으로 승인합니다 (Edit, Write, Bash 등)",
  );
export const s_autoApproveOffDesc = () =>
  L(
    "Claude will ask for approval before using tools",
    "Claude 在调用工具前将请求确认。",
    "Claude가 도구 사용 전에 승인을 요청합니다",
  );

// ─────────────────────────────────────────────
// commands/stop.ts
// ─────────────────────────────────────────────
export const s_channelNotRegProject6 = s_channelNotRegProject; // alias
export const s_sessionStopped     = () => L("Session Stopped",         "会话已停止",            "세션 중지됨");
export const s_sessionStoppedDesc = (projectPath: string) =>
  L(
    `Stopped Claude Code session for \`${projectPath}\``,
    `已停止 \`${projectPath}\` 的 Claude Code 会话`,
    `\`${projectPath}\` Claude Code 세션이 중지되었습니다`,
  );
export const s_noActiveSession    = () => L("No active session in this channel.", "此频道没有活跃的会话。", "이 채널에 활성 세션이 없습니다.");

// ─────────────────────────────────────────────
// commands/unregister.ts
// ─────────────────────────────────────────────
export const s_deleteWorkspaceOption = () =>
  L(
    "Also delete the Coder workspace (default: false)",
    "同时删除 Coder 工作区（默认：false）",
    "Coder 워크스페이스도 함께 삭제합니다 (기본값: false)",
  );
export const s_channelNotRegProject7 = s_channelNotRegProject; // alias
export const s_deletingWorkspace  = () =>
  L(" Deleting Coder workspace too...", " 同时删除 Coder 工作区...", " Coder 워크스페이스도 삭제합니다...");
export const s_workspaceKept = (name: string) =>
  L(
    ` Coder workspace \`${name}\` was kept.`,
    ` Coder 工作区 \`${name}\` 已保留。`,
    ` Coder 워크스페이스 \`${name}\`는 유지됩니다.`,
  );
export const s_projectUnregistered = () => L("Project Unregistered",   "项目已注销",            "프로젝트 등록 해제됨");
export const s_unregisteredDesc = (projectPath: string, workspaceNote: string) =>
  L(
    `Removed link to \`${projectPath}\`. Deleting channel...${workspaceNote}`,
    `已移除 \`${projectPath}\` 的关联，正在删除频道...${workspaceNote}`,
    `\`${projectPath}\` 연결이 해제되었습니다. 채널을 삭제합니다...${workspaceNote}`,
  );

// ─────────────────────────────────────────────
// commands/clear-sessions.ts
// ─────────────────────────────────────────────
export const s_channelNotRegProject8 = s_channelNotRegProject; // alias
export const s_noSessionDir = (projectPath: string) =>
  L(
    `No session directory found for \`${projectPath}\``,
    `未找到 \`${projectPath}\` 的会话目录`,
    `\`${projectPath}\`에 대한 세션 디렉토리를 찾을 수 없습니다`,
  );
export const s_noSessionFiles     = () => L("No session files to delete.", "没有可删除的会话文件。", "삭제할 세션 파일이 없습니다.");
export const s_sessionsCleared    = () => L("Sessions Cleared",         "会话已清除",            "세션 정리됨");
export const s_sessionsClearedDesc = (count: number) =>
  L(
    `Deleted **${count}** session file(s)`,
    `已删除 **${count}** 个会话文件`,
    `**${count}**개의 세션 파일이 삭제되었습니다`,
  );

// ─────────────────────────────────────────────
// commands/last.ts
// ─────────────────────────────────────────────
export const s_channelNotRegProject9 = s_channelNotRegProject; // alias
export const s_noActiveSessionLast = () =>
  L(
    "No active session. Select a session from `/sessions`.",
    "没有活跃的会话，请通过 `/sessions` 选择一个会话。",
    "활성 세션이 없습니다. `/sessions`에서 세션을 선택하세요.",
  );
export const s_sessionDirNotFound = () =>
  L("Session directory not found.", "未找到会话目录。", "세션 디렉토리를 찾을 수 없습니다.");
export const s_cannotReadSession  = () =>
  L("Cannot read session file.", "无法读取会话文件。", "세션 파일을 읽을 수 없습니다.");
export const s_noClaudeResponse   = () =>
  L("No Claude response in this session.", "此会话中没有 Claude 的回复。", "이 세션에 Claude 응답이 없습니다.");

// ─────────────────────────────────────────────
// commands/status.ts
// ─────────────────────────────────────────────
export const s_noProjectsRegistered = () =>
  L(
    "No projects registered. Use `/register` in a channel first.",
    "尚未注册任何项目，请先在频道中使用 `/register`。",
    "등록된 프로젝트가 없습니다. 먼저 채널에서 `/register`를 사용하세요.",
  );
export const s_workspace          = () => L("Workspace",               "工作区",               "워크스페이스");
export const s_model              = () => L("Model",                   "模型",                  "모델");
export const s_defaultValue       = () => L("default",                 "默认",                  "기본값");
export const s_lastActivity       = () => L("Last activity",           "最后活动",              "마지막 활동");

// ─────────────────────────────────────────────
// bot/client.ts
// ─────────────────────────────────────────────
export const s_notAuthorized      = () =>
  L("You are not authorized to use this bot.", "您无权使用此机器人。", "이 봇을 사용할 권한이 없습니다.");
export const s_commandError       = () =>
  L("An error occurred while processing your command.", "处理命令时发生错误。", "명령을 처리하는 중 오류가 발생했습니다.");
export const s_messageError       = () =>
  L("An error occurred while processing your message.", "处理消息时发生错误。", "메시지를 처리하는 중 오류가 발생했습니다.");

// ─────────────────────────────────────────────
// bot/handlers/message.ts
// ─────────────────────────────────────────────
export const s_blockedFile = (name: string) =>
  L(
    `Blocked: \`${name}\` (dangerous file type)`,
    `已拦截：\`${name}\`（危险文件类型）`,
    `차단됨: \`${name}\` (위험한 파일 형식)`,
  );
export const s_skippedFile = (name: string, sizeMB: string) =>
  L(
    `Skipped: \`${name}\` (${sizeMB}MB exceeds 25MB limit)`,
    `已跳过：\`${name}\`（${sizeMB}MB，超过 25MB 限制）`,
    `건너뜀: \`${name}\` (${sizeMB}MB, 25MB 제한 초과)`,
  );
export const s_downloadFailed = (name: string) =>
  L(
    `Failed to download: \`${name}\``,
    `下载失败：\`${name}\``,
    `다운로드 실패: \`${name}\``,
  );
export const s_notAuthorizedMsg   = s_notAuthorized; // alias
export const s_rateLimitExceeded  = () =>
  L("Rate limit exceeded. Please wait a moment.", "请求频率超限，请稍后再试。", "요청 한도를 초과했습니다. 잠시 후 다시 시도하세요.");
export const s_queuePendingWait   = () =>
  L(
    "⏳ A message is already waiting to be queued. Please press the button first.",
    "⏳ 已有一条消息等待入队，请先点击按钮处理。",
    "⏳ 이미 큐 추가 대기 중인 메시지가 있습니다. 버튼을 먼저 눌러주세요.",
  );
export const s_queueFull          = () =>
  L(
    "⏳ Queue is full (max 5). Please wait for the current task to finish.",
    "⏳ 队列已满（最多 5 条），请等待当前任务完成。",
    "⏳ 큐가 가득 찼습니다 (최대 5개). 현재 작업 완료를 기다려주세요.",
  );
export const s_addToQueue         = () => L("Add to Queue",            "加入队列",              "큐에 추가");
export const s_cancel             = () => L("Cancel",                  "取消",                  "취소");
export const s_taskInProgress     = () =>
  L(
    "⏳ A previous task is in progress. Process this automatically when done?",
    "⏳ 上一个任务正在进行中，完成后自动处理此消息？",
    "⏳ 이전 작업이 진행 중입니다. 완료 후 자동으로 처리할까요?",
  );

// ─────────────────────────────────────────────
// bot/handlers/interaction.ts
// ─────────────────────────────────────────────
export const s_notAuthorizedShort = () => L("You are not authorized.", "您无权执行此操作。", "권한이 없습니다.");
export const s_invalidButton      = () =>
  L("Invalid button interaction.", "无效的按钮交互。", "잘못된 버튼 상호작용입니다.");
export const s_taskStopped        = () => L("⏹️ Task has been stopped.", "⏹️ 任务已停止。", "⏹️ 작업이 중지되었습니다.");
export const s_noActiveSessionShort = () => L("No active session.", "没有活跃的会话。", "활성 세션이 없습니다.");
export const s_queueExpired       = () => L("⏳ Queue request has expired.", "⏳ 排队请求已过期。", "⏳ 큐 요청이 만료되었습니다.");
export const s_messageAddedToQueue = (size: number) =>
  L(
    `📨 Message added to queue (${size}/5). It will be processed after the current task.`,
    `📨 消息已加入队列（${size}/5），将在当前任务完成后自动处理。`,
    `📨 메시지가 큐에 추가되었습니다 (${size}/5). 이전 작업 완료 후 자동으로 처리됩니다.`,
  );
export const s_cancelled          = () => L("Cancelled.", "已取消。", "취소되었습니다.");
export const s_sessionResumed     = () => L("Session Resumed",         "会话已恢复",            "세션 재개됨");
export const s_sessionResumedDesc = (sessionId: string) =>
  L(
    `Session: \`${sessionId.slice(0, 8)}...\`\n\nNext message you send will resume this conversation.`,
    `会话：\`${sessionId.slice(0, 8)}...\`\n\n下一条消息将继续此对话。`,
    `세션: \`${sessionId.slice(0, 8)}...\`\n\n다음 메시지부터 이 대화가 재개됩니다.`,
  );
export const s_questionExpired    = () =>
  L("This question has expired.", "此问题已过期。", "이 질문은 만료되었습니다.");
export const s_selected = (label: string) =>
  L(`✅ Selected: **${label}**`, `✅ 已选择：**${label}**`, `✅ 선택됨: **${label}**`);
export const s_typeAnswer         = () =>
  L("✏️ Type your answer...", "✏️ 请输入您的答案...", "✏️ 답변을 입력하세요...");
export const s_itemNotInQueue     = () =>
  L("This item is no longer in the queue.", "此项目已不在队列中。", "이 항목은 이미 큐에 없습니다.");
export const s_messageRemoved     = () => L("Message Removed",         "消息已移除",            "메시지 취소됨");
export const s_messageRemovedDesc = (preview: string) =>
  L(
    `Removed: ${preview}\n\nQueue is now empty.`,
    `已移除：${preview}\n\n队列现已清空。`,
    `취소됨: ${preview}\n\n큐가 비었습니다.`,
  );
export const s_removed            = () => L("removed",                 "已移除",                "취소됨");
export const s_projectNotFound    = () => L("Project not found.",      "未找到项目。",           "프로젝트를 찾을 수 없습니다.");
export const s_sessionDeleted     = () => L("Session Deleted",         "会话已删除",            "세션 삭제됨");
export const s_sessionDeletedDesc = (sessionId: string) =>
  L(
    `Session \`${sessionId.slice(0, 8)}...\` has been deleted.\nYour next message will start a new conversation.`,
    `会话 \`${sessionId.slice(0, 8)}...\` 已删除。\n下一条消息将开始新对话。`,
    `세션 \`${sessionId.slice(0, 8)}...\`이(가) 삭제되었습니다.\n다음 메시지부터 새로운 대화가 시작됩니다.`,
  );
export const s_failedDeleteSession = () =>
  L("Failed to delete session file.", "删除会话文件失败。", "세션 파일 삭제에 실패했습니다.");
export const s_approvalExpired    = () =>
  L("This approval request has expired.", "此审批请求已过期。", "이 승인 요청은 만료되었습니다.");
export const s_approved           = () => L("✅ Approved",              "✅ 已批准",              "✅ 승인됨");
export const s_denied             = () => L("❌ Denied",                "❌ 已拒绝",              "❌ 거부됨");
export const s_autoApproveEnabled = () =>
  L(
    "⚡ Auto-approve enabled for this channel",
    "⚡ 已为此频道启用自动批准",
    "⚡ 이 채널에서 자동 승인이 활성화되었습니다",
  );
export const s_newSessionReady    = () =>
  L(
    "New session is ready.\nA new conversation will start from your next message.",
    "新会话已就绪。\n下一条消息将开始新对话。",
    "새 세션이 준비되었습니다.\n다음 메시지부터 새로운 대화가 시작됩니다.",
  );
export const s_resume             = () => L("Resume",                  "恢复",                  "재개");
export const s_delete             = () => L("Delete",                  "删除",                  "삭제");
export const s_lastConversation   = () => L("**Last conversation:**",  "**最后一次对话：**",     "**마지막 대화:**");
export const s_sessionSelected    = () => L("Session Selected",        "已选择会话",            "세션 선택됨");
export const s_sessionSelectedDesc = (sessionId: string) =>
  L(
    `Session: \`${sessionId.slice(0, 8)}...\`\n\nResume or delete this session?`,
    `会话：\`${sessionId.slice(0, 8)}...\`\n\n恢复还是删除此会话？`,
    `세션: \`${sessionId.slice(0, 8)}...\`\n\n이 세션을 재개 또는 삭제하시겠습니까？`,
  );
