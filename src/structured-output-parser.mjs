import dotenv from 'dotenv'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { ChatOpenAI } from '@langchain/openai'
import path from 'path'

const __dirname = import.meta.dirname

dotenv.config({
  path: path.resolve(__dirname, '../.env')
})

const model = new ChatOpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
  model: process.env.OPEN_AI_MODEL,
  configuration: {
    baseURL: process.env.OPEN_AI_BASE_URL
  }
})

// 定义输出结构
const parser = StructuredOutputParser.fromNamesAndDescriptions({
  name: "姓名",
  birth_year: "出生年份",
  nationality: "国籍",
  major_achievements: "主要成就，用逗号分隔的字符串",
  famous_theory: "著名理论"
})

const question = `请介绍一下爱因斯坦的信息。

${parser.getFormatInstructions()}`

console.log('question:', question)

try {
  console.log("🤔 正在调用大模型(使用 StructuredOutputParser)...\n")

  const response = await model.invoke(question)

  console.log("📤 模型原始响应:\n")
  console.log(response.content)

  const result = await parser.parse(response.content)

  console.log("\n✅ StructuredOutputParser 自动解析的结果:\n")
  console.log(result)
} catch (error) {
  console.error("❌ 错误:", error.message);
}