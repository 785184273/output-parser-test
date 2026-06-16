import dotenv from 'dotenv'
import path from 'path'
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'
// import { zodToJsonSchema } from 'zod-to-json-schema'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { toJsonSchema } from "@langchain/core/utils/json_schema";

const __dirname = import.meta.dirname

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const scientistSchema = z.object({
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

/**
 * 将 Zod 模式转换为 JSON Schema
 */
const nativeJsonSchema = toJsonSchema(scientistSchema)

const model = new ChatOpenAI({
  model: process.env.OPEN_AI_MODEL,
  apiKey: process.env.OPEN_AI_API_KEY,
  configuration: {
    baseURL: process.env.OPEN_AI_BASE_URL
  },
  modelKwargs: {
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "scientist",
        strict: true,
        schema: nativeJsonSchema
      }
    }
  }
})

const testNativeJsonSchema = async () => {

  console.log('正在测试原生 JSON Schema...')

  const res = await model.invoke([
    new SystemMessage("你是一个科学家信息收集助手，请根据用户的问题收集科学家信息"),
    new HumanMessage("请介绍一下杨振宁")
  ])

  console.log(JSON.parse(res.content))

  console.log('原生 JSON Schema 测试完成')
}

testNativeJsonSchema().catch(console.error)