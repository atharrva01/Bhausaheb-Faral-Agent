import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type InferUITools,
  type UIMessage,
} from "ai";
import { chatModel, friendlyAiError, googleOptions } from "@/lib/ai/model";
import { customerTools } from "@/lib/ai/customer-tools";
import { customerSystemPrompt } from "@/lib/ai/prompts";
import { getSessionId } from "@/lib/session";

export const maxDuration = 60;

export type CustomerUIMessage = UIMessage<unknown, never, InferUITools<ReturnType<typeof customerTools>>>;

const MAX_HISTORY = 24; // keep prompts small on the free tier

export async function POST(req: Request) {
  const sessionId = await getSessionId();
  const { messages }: { messages: CustomerUIMessage[] } = await req.json();
  const tools = customerTools(sessionId);

  const result = streamText({
    model: chatModel,
    system: await customerSystemPrompt(),
    messages: await convertToModelMessages(messages.slice(-MAX_HISTORY), { tools }),
    tools,
    stopWhen: isStepCount(6),
    maxRetries: 1,
    providerOptions: googleOptions,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream, tools, onError: friendlyAiError }),
  });
}
