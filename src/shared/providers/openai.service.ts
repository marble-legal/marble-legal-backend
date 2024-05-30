import OpenAI from "openai";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OpenAIService {
  constructor() {}

  async suggestMessage(
    prompt: string,
    previousMessages: any[],
    isJsonResponse: boolean,
    systemPrompt?: string,
  ) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const messages = [];

      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }

      messages.push(...previousMessages);

      const params: any = {
        messages: [...messages, { role: "user", content: prompt }],
        model: "gpt-4-1106-preview",
        n: 1,
        temperature: 1,
      };

      if (isJsonResponse) {
        params["response_format"] = { type: "json_object" };
      }

      const chatCompletion = await openai.chat.completions.create(params);

      const msg =
        chatCompletion.choices && chatCompletion.choices.length > 0
          ? chatCompletion.choices[0].message.content
          : undefined;
      if (!msg) return undefined;

      return msg.includes("```json")
        ? msg.split("```json")[1].split("```")[0]
        : msg;
    } catch (err: any) {
      throw err;
    }
  }

  async analyseImage(
    prompt: string,
    imageUrls: string[],
    systemPrompt?: string,
  ) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const messages = [];

      if (systemPrompt) {
        messages.push({
          role: "system",
          content: systemPrompt,
        });
      }

      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
          ...imageUrls.map((url) => {
            return {
              type: "image_url",
              image_url: {
                url: url,
              },
            };
          }),
        ],
      });

      const chatCompletion = await openai.chat.completions.create({
        messages,
        model: "gpt-4-vision-preview",
        n: 1,
        max_tokens: 1000,
        temperature: 0.2,
      });

      return chatCompletion.choices && chatCompletion.choices.length > 0
        ? chatCompletion.choices[0].message.content
        : undefined;
    } catch (err: any) {
      throw err;
    }
  }
}
