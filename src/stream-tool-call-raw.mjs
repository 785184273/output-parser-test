import dotenv from 'dotenv'
import path from 'path'
import { ChatOpenAI } from '@langchain/openai'
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
  death_year: z.number().optional().describe("去世年份，如果还在世则不填"),
  nationality: z.string().describe("国籍"),
  fields: z.array(z.string()).describe("研究领域列表"),
  achievements: z.array(z.string()).describe("主要成就"),
  biography: z.string().describe("简短传记")
})

const modelWithTool = model.bindTools([
  {
    name: "extract_scientist_info",
    description: "提取和结构化科学家的详细信息",
    schema: scientistSchema
  }
])

try {

  const readableStream = await modelWithTool.stream('介绍一下爱因斯坦')
  let chunkCount = 0
  let fullContent = ''

  for await (const chunk of readableStream) {
    chunkCount++
    if (chunk.tool_call_chunks && chunk.tool_call_chunks.length) {
      const content = chunk.tool_call_chunks[0].args
      fullContent += content
      process.stdout.write(content)
    }
  }

  console.log("\n\n✅ 流式输出完成")
  
} catch (err) {
  console.error("\n❌ 错误:", error.message)
  console.error(error)
}
