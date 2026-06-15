import { ChatOpenAI } from "@langchain/openai"
import dotenv from "dotenv"
import z from "zod"
import path from "path"

const __dirname = import.meta.dirname

dotenv.config({ path: path.resolve(__dirname, "../.env") })

const model = new ChatOpenAI({
  model: process.env.OPEN_AI_MODEL,
  apiKey: process.env.OPEN_AI_API_KEY,
  configuration: {
    baseURL: process.env.OPEN_AI_BASE_URL
  }
})

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

const structuredModel = model.withStructuredOutput(schema, {
  method: "functionCalling"
})

const result = await structuredModel.invoke("请介绍一下爱因斯坦")

console.log(result)