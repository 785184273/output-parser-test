import dotenv from 'dotenv'
import path from 'path'
import { ChatOpenAI } from '@langchain/openai'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import z from 'zod'

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

// 定义结构化输出的 schema
const scientistSchema = z.object({
  name: z.string().describe("科学家的全名"),
  birth_year: z.number().describe("出生年份"),
  nationality: z.string().describe("国籍"),
  fields: z.array(z.string()).describe("研究领域列表"),
})

// 使用 withStructuredOutput 方法
// 给模型绑定一个schema，让输入强制格式化
const structuredModel = model.withStructuredOutput(scientistSchema)

// 调用模型
const result = await structuredModel.invoke("介绍一下爱因斯坦 json")
console.log("结构化结果: ", JSON.stringify(result, null, 2))