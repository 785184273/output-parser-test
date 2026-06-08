import dotenv from 'dotenv'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { ChatOpenAI } from '@langchain/openai'
import path from 'path'
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
// 只用 zod 定义模式
const parser = StructuredOutputParser.fromZodSchema(z.object({
  username: z.string().describe('姓名'),
  birth_year: z.number().describe("出生年份"),
  death_year: z.number().optional().describe("去世年份，如果还在世则不填"),
  nationality: z.string().describe("国籍"),
  fields: z.array(z.string()).describe("研究领域列表"),
  awards: z.array(
    z.object({
      name: z.string().describe("奖项名称"),
      year: z.number().describe("获奖年份"),
      reason: z.string().optional().describe("获奖原因")
    })
  ).describe("获得的重要奖项列表"),
  major_achievements: z.array(z.string()).describe("主要成就列表"),
  famous_theories: z.array(
    z.object({
      name: z.string().describe("理论名称"),
      year: z.number().optional().describe("提出年份"),
      description: z.string().describe("理论简要描述")
    })
  ).describe("著名理论列表"),
  education: z.object({
    university: z.string().describe("主要毕业院校"),
    degree: z.string().describe("学位"),
    graduation_year: z.number().optional().describe("毕业年份")
  }).optional().describe("教育背景"),
  biography: z.string().describe("简短传记, 100字以内")
}))

const question = `请介绍一下袁隆平的信息。

${parser.getFormatInstructions()}`

console.log('question:', question)

try {
  console.log("🤔 正在调用大模型(使用 zod Schema)...\n")

  const response = await model.invoke(question)

  console.log("📤 模型原始响应:\n")
  console.log(response.content)

  const result = await parser.parse(response.content)

  console.log("\n✅ StructuredOutputParser 自动解析的结果:\n")
  console.log(result)
} catch (error) {
  console.error("❌ 错误:", error.message);
}