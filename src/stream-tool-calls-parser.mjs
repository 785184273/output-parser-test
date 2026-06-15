import dotenv from "dotenv"
import path from "path"
import { ChatOpenAI } from "@langchain/openai"
import { z } from "zod"
import { JsonOutputToolsParser } from "@langchain/core/output_parsers/openai_tools"

const __dirname = import.meta.dirname

dotenv.config({ path: path.resolve(__dirname, "../.env") })

const model = new ChatOpenAI({
  model: process.env.OPEN_AI_MODEL,
  apiKey: process.env.OPEN_AI_API_KEY,
  configuration: {
    baseURL: process.env.OPEN_AI_BASE_URL
  }
})

/**
 * 科学家的信息结构
 */
const schema = z.object({
  name: z.string().describe("科学家的全名"),
  birth_year: z.number().describe("科学家的出生年份"),
  death_year: z.number().describe("科学家的死亡年份"),
  description: z.string().describe("科学家的生平简介"),
  nationality: z.string().describe("科学家的国籍"),
  field: z.array(z.string()).describe("科学家的研究领域"),
  achievements: z.array(z.string()).describe("科学家的主要成就"),
  contributions: z.array(z.string()).describe("科学家的主要贡献"),
  references: z.array(z.string()).describe("科学家的参考文献"),
})

const modelWithTool = model.bindTools([
  {
    name: "get_scientist_info",
    description: "获取科学家的信息",
    schema: schema,
  }
])


const parser = new JsonOutputToolsParser()
const chain = modelWithTool.pipe(parser)

try {
  const stream = await chain.stream("请介绍牛顿的信息")
  console.log("🔍 正在获取科学家的信息...")
  for await (const chunk of stream) {
    if (chunk.length) {
      const toolCall = chunk[0]
      console.log(toolCall.args)
    }
  }
  console.log("\n🎉 获取科学家信息完成！")
} catch (error) {
  console.error("\n❌ 错误：", error.message)
}