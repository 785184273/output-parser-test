import { ChatOpenAI } from "@langchain/openai"
import dotenv from "dotenv"
import path from "path"
import { readFileTool, writeFileTool, execCommandTool, listDirectoryTool } from './all-tools.mjs'
import { HumanMessage, SystemMessage, ToolMessage, AIMessage } from '@langchain/core/messages'
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history'
import chalk from 'chalk'

const __dirname = import.meta.dirname

dotenv.config({ path: path.resolve(__dirname, "../.env") })

const model = new ChatOpenAI({
  model: process.env.OPEN_AI_MODEL,
  apiKey: process.env.OPEN_AI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPEN_AI_BASE_URL
  }
})

const tools = [
  readFileTool,
  writeFileTool,
  execCommandTool,
  listDirectoryTool
]

const modelWithTool = model.bindTools(tools)

const runAgentWithTools = async (query, maxIterations = 30) => {
  /**
   * 消息记录历史对象
   */
  const history = new InMemoryChatMessageHistory()
  /**
   * 添加系统提示词
   */
  await history.addMessage(new SystemMessage(
    `
      你是一个项目管理助手，使用工具完成任务。
      当前工作目录: ${process.cwd()}
  
      工具:
      - read_file: 读取文件内容
      - write_file: 写入文件内容
      - exec_command: 执行命令（支持指定工作目录）
      - list_directory: 列出目录内容
  
      重要规则 - exec_command:
      - workingDirectory 参数是可选的，如果未指定，则使用当前工作目录，如果指定了，则使用指定的目录。
      - 当使用了 workingDirectory 参数时，绝对不要在command 中使用cd命令，直接使用 workingDirectory 参数。
      - 错误示例: { command: "cd vue-todo-app && pnpm install", workingDirectory: "vue-todo-app" },这是错误的，因为 workingDirectory 已经在 react-todo-app 目录了。
      - 正确示例: { command: "npm create vue@latest vue-todo-app", workingDirectory: "vue-todo-app" }
  
      回复要简洁，只说做了什么
    `
  ))
  /**
   * 添加用户提示词
   */
  await history.addMessage(new HumanMessage(query))

  /**
   * 循环调用大模型，直到有工具调用或达到最大迭代次数
   */
  for (let i = 0; i < maxIterations; i++) {
    let fullAIMessage = null
    let printedLengths = new Map()

    /**
     * 获取消息记录历史 作为大模型的输入
     */
    console.log(chalk.bgBlue('大模型正在思考中...'))
    const messages = await history.getMessages()
    const stream = await modelWithTool.stream(messages)
    for await (const chunk of stream) {
      fullAIMessage = fullAIMessage
        ? fullAIMessage.concat(chunk)
        : chunk

      const parsedTools = fullAIMessage.tool_calls
      if (parsedTools && parsedTools.length > 0) {
        for (const toolCall of parsedTools) {
          if (toolCall.name === 'write_file' && toolCall.args?.content) {
            const toolCallId = toolCall.id
            const currentContent = String(toolCall.args.content)
            const previousLength = printedLengths.get(toolCallId)

            if (previousLength === undefined) {
              printedLengths.set(toolCallId, 0)
              console.log(
                chalk.bgGreen(
                  `\n[工具调用] write_file - 写入文件: ${toolCall.args.filePath}`
                )
              )
            }

            if (currentContent.length > previousLength) {
              process.stdout.write(
                currentContent.slice(previousLength)
              )
              printedLengths.set(toolCallId, currentContent.length)
            }
          }
        }
      } else {
        const content = chunk.content
        if (content) {
          process.stdout.write(
            typeof content === 'string'
              ? content
              : JSON.stringify(content)
          )
        }
      }
    }

    /**
     * 添加完整的 AI 消息内容到历史记录
     */
    await history.addMessage(new AIMessage(fullAIMessage))

    if (fullAIMessage.tool_calls && fullAIMessage.tool_calls.length > 0) {
      /**
       * 遍历工具调用
       */
      for (const toolCall of fullAIMessage.tool_calls) {
        const toolName = toolCall.name
        const tool = tools.find(t => t.name === toolName)
        if (!tool) {
          return console.log(chalk.bgRed(`\n[警告] 未找到工具: ${toolName}，工具调用id: ${toolCallId}`))
        }
        const toolCallId = toolCall.id
        const toolArgs = toolCall.args
        console.log(chalk.bgGreen(`\n[调用工具: ${toolName}]`))
        const toolResult = await tool.invoke(toolArgs)
        /**
         * 添加工具调用结果到历史记录
         */
        await history.addMessage(
          new ToolMessage({
            content: toolResult,
            tool_call_id: toolCallId
          })
        )
      }
    } else {
      console.log(chalk.bgGreen('\n没有工具调用，直接输出答案'))
      console.log(chalk.bgGreen('最终答案: '), fullAIMessage.content)
      return fullAIMessage.content
    }
  }
  /**
   * 获取最终答案
   */
  const messages = await history.getMessages()
  const lastMessage = messages[messages.length - 1]
  if (lastMessage instanceof AIMessage) {
    console.log(chalk.bgGreen('最终答案: '), lastMessage.content)
    return lastMessage.content
  }
}

const prompt = `使用vite创建一个vue todoList 应用 :
  1.使用指令 npm create vue@latest vue-todo-app 创建项目
  2.修改src/App.vue文件，实现完整功能的todoList应用:
    - 添加、删除、编辑、标记完成
    - 分类筛选(全部、进行中、已完成)
    - 统计信息显示
    - localStorage 持久化
  3.添加好看的css样式，美化UI界面
  4.添加动画
    - 添加/删除时的过渡动画
    - 筛选状态切换时的动画
  5.列出目录确认
  6.使用pnpm install安装依赖
  7.使用pnpm run dev运行项目
`
try {
  await runAgentWithTools(prompt)
} catch (error) {
  console.error(chalk.bgRed('错误: '), error)
}