import OpenAI from "openai";
import { Injectable } from "@nestjs/common";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAIEmbeddings, OpenAI as LLMOpenAI } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { ConversationalRetrievalQAChain } from "langchain/chains";

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

  async storeDocumentInRagLayer(documentUrl: string, documentId: string) {
    // Create docs with a loader
    const loader = new PDFLoader(documentUrl);
    const docs = await loader.load();

    // Create vector store and index the docs
    const vectorStore = await Chroma.fromDocuments(
      docs,
      new OpenAIEmbeddings(),
      {
        collectionName: documentId,
        url: "https://chroma-db.api.marblels.com", // Optional, will default to this value
      },
    );
  }

  async provideResponseFromDocument(documentId: string, query: string) {
    const vectorStore = await Chroma.fromExistingCollection(
      new OpenAIEmbeddings(),
      { collectionName: documentId, url: "https://chroma-db.api.marblels.com" },
    );

    // const retriever = vectorStore.asRetriever({ k: 6, searchType: "similarity" });

    // // const response = await vectorStore.similaritySearch(query, 2);
    // // console.log(response);

    // const retrievedDocs = await retriever.invoke(
    //   "How much is the compensation?"
    // );

    // console.log(retrievedDocs);

    const CONDENSE_PROMPT = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`;

    const QA_PROMPT = `You are a helpful AI assistant. Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say you don't know. DO NOT try to make up an answer.
If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.

{context}

Question: {question}
Helpful answer in markdown:`;

    const model = new LLMOpenAI({
      temperature: 1, // increase temepreature to get more creative answers
      modelName: "gpt-4", //change this to gpt-4 if you have access
    });

    const chain = ConversationalRetrievalQAChain.fromLLM(
      model,
      vectorStore.asRetriever(),
      {
        qaTemplate: QA_PROMPT,
        returnSourceDocuments: true,
      },
    );

    const history = [];

    const sanitizedQuestion = query.trim().replace(/\n/g, " ");
    const response = await chain.call({
      question: sanitizedQuestion,
      chat_history: history || [],
    });

    console.log(response);
    return response.text;
  }
}
