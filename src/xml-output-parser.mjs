import { ChatOpenAI } from "@langchain/openai"
import dotenv from "dotenv"
import path from "path"
import { XMLOutputParser } from "@langchain/core/output_parsers"

const __dirname = import.meta.dirname

dotenv.config({ path: path.resolve(__dirname, "../.env") })

const model = new ChatOpenAI({
  model: process.env.OPEN_AI_MODEL,
  apiKey: process.env.OPEN_AI_API_KEY,
  configuration: {
    baseURL: process.env.OPEN_AI_BASE_URL
  }
})

const parser = new XMLOutputParser()

const question = `介绍一下爱因斯坦

${parser.getFormatInstructions()}
`

try {

  console.log("🔍 正在调用大模型（使用 XMLOutputParser 解析 XML 输出）...")
  const stream = await model.stream(question)
  let fullText = ""
  console.log("\n🔍 正在拼接大模型输出...")
  for await (const chunk of stream) {
    const content = chunk.content
    if (content) {
      fullText += content
      process.stdout.write(content)
    }
  }

  console.log("\n🎉 大模型调用完成！")

  console.log("\n🔍 解析结果：", await parser.parse(fullText))
  console.log("\n🎉 解析完成！")
} catch (error) {
  console.error("\n❌ 错误：", error.message)
}