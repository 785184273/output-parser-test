import { tool } from "@langchain/core/tools"
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { z } from 'zod'

// 1. 读取文件
const readFileTool = tool(
  // 异步函数，返回文件内容
  async ({ filePath }) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      console.log(` [工具调用] read_file("${filePath}") - 成功读取${content.length}字节`)
      return `文件内容: ${content}`
    } catch (error) {
      console.error(` [工具调用] read_file("${filePath}") - 失败: ${error.message}`)
      return `文件读取失败: ${error.message}`
    }
  },
  // 工具定义
  {
    name: 'read_file',
    description: '读取指定路径的文件内容',
    schema: z.object({
      filePath: z.string().describe('文件路径')
    })
  }
)

// 2.写入文件工具
const writeFileTool = tool(
  // 异步函数，返回文件写入结果
  async ({ filePath, content }) => {
    try {
      const dir = path.dirname(filePath)
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(filePath, content)
      console.log(` [工具调用] write_file("${filePath}") - 成功写入${content.length}字节`)
      return `文件写入成功`
    } catch (error) {
      console.error(` [工具调用] write_file("${filePath}") - 失败: ${error.message}`)
      return `文件写入失败: ${error.message}`
    }
  },
  // 工具定义
  {
    name: 'write_file',
    description: '向指定路径写入文件内容, 自动创建目录',
    schema: z.object({
      filePath: z.string().describe('文件路径'),
      content: z.string().describe('文件内容')
    })
  }
)

// 3.执行命令工具
const execCommandTool = tool(
  // 异步函数，返回命令执行结果
  async ({ command, workingDirectory }) => {
    const cwd = workingDirectory || process.cwd()
    console.log(`\n [工具调用] exec_command("${command}") - 工作目录: ${cwd}`)

    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ')
      const child = spawn(cmd, args, {
        cwd,
        stdio: 'inherit',
        shell: true
      })

      let errorMsg = ''
      // 捕获子进程错误
      child.on('error', error => {
        errorMsg = `\n [子进程错误] ${error.message}`
      })

      // 捕获子进程退出
      child.on('close', code => {
        if (code === 0) {
          console.log(`\n [工具调用] exec_command("${command}") - 成功执行, 退出码: ${code}`)
          const cwdInfo = workingDirectory
            ? `\n\n重要提示: 命令在目录 "${workingDirectory}" 中执行成功。如果需要在这个项目目录中继续执行命令，请使用 workingDirectory: "${workingDirectory}" 参数，不要使用cd命令。`
            : ''
          resolve(`命令执行成功: ${command}${cwdInfo}`)
        } else {
          console.error(`\n [工具调用] exec_command("${command}") - 失败, 退出码: ${code}`)
          reject(`命令执行失败，退出码: ${code}, 错误信息: ${errorMsg}`)
        }
      })
    })
  },
  // 工具定义
  {
    name: 'exec_command',
    description: '执行系统命令, 支持指定工作目录, 实时显示输出',
    schema: z.object({
      command: z.string().describe('要执行的命令'),
      workingDirectory: z.string().describe('工作目录').optional()
    })
  }
)

// 4.列出目录内容工具
const listDirectoryTool = tool(
  // 异步函数，返回目录内容
  async ({ directoryPath }) => {
    try {
      const files = await fs.readdir(directoryPath)
      console.log(`\n [工具调用] list_directory("${directoryPath}") - 成功列出${files.length}个文件/目录`)
      return `目录内容:\n${files.map(file => `- ${file}`).join('\n')}`
    } catch (error) {
      console.error(`\n [工具调用] list_directory("${directoryPath}") - 失败: ${error.message}`)
      return `目录列表失败: ${error.message}`
    }
  },
  // 工具定义
  {
    name: 'list_directory',
    description: '列出指定目录文件和文件夹',
    schema: z.object({
      directoryPath: z.string().describe('目录路径')
    })
  }
)

export {
  readFileTool,
  writeFileTool,
  execCommandTool,
  listDirectoryTool
}