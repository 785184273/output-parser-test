import path from 'path'
import dotenv from 'dotenv'
import z from 'zod'
import { ChatOpenAI } from '@langchain/openai'
import { StructuredOutputParser } from '@langchain/core/output_parsers'

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

const schema = z.object({
  name: z.string().describe("姓名"),
  birth_year: z.number().describe("出生年份"),
  death_year: z.number().describe("去世年份"),
  nationality: z.string().describe("国籍"),
  occupation: z.string().describe("职业"),
  famous_works: z.array(z.string()).describe("著名作品列表"),
  biography: z.string().describe("简短传记")
})

const parser = StructuredOutputParser.fromZodSchema(schema)

const prompt = `详细介绍莫扎特的信息。\n\n${parser.getFormatInstructions()}`

console.log('提示词: ', prompt)

console.log("🌊 流式结构化输出演示\n")

try {
  const readable = await model.stream(prompt)

  let fullContent = ''
  let chunkCount = 0

  console.log("📡 接收流式数据:\n")

  for await (const chunk of readable) {
    chunkCount++
    const content = chunk.content
    fullContent += content
    process.stdout.write(content)
  }

  console.log(`\n\n✅ 共接收 ${chunkCount} 个数据块\n`)
  const result = await parser.parse(fullContent)

  console.log("📊 解析后的结构化结果:\n")
  console.log(JSON.stringify(result, null, 2))
} catch (err) {

}

