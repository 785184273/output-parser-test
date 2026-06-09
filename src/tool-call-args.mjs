import dotenv from 'dotenv'
import { ChatOpenAI } from '@langchain/openai'
import z from 'zod'
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

// 定义结构化输出的 schema
const scientistSchema = z.object({
  name: z.string().describe("科学家的全名"),
  birth_year: z.number().describe("出生年份"),
  nationality: z.string().describe("国籍"),
  fields: z.array(z.string()).describe("研究领域列表"),
})

const modelWithTool = model.bindTools([
  {
    name: "extract_scientist_info",
    description: "提取和结构化科学家的详细信息",
    schema: scientistSchema
  }
])

// 调用模型
const response = await modelWithTool.invoke("介绍一下爱因斯坦")

console.log('response.tool_calls: ', response.tool_calls)

// 获取结构化结果
const result = response.tool_calls[0].args

console.log("结构化结果:", JSON.stringify(result, null, 2))