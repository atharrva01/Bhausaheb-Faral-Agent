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
import { ownerTools } from "@/lib/ai/owner-tools";
import { ownerSystemPrompt } from "@/lib/ai/prompts";
import { requireOwner } from "@/lib/owner-session";

export const maxDuration = 60;

export type OwnerUIMessage = UIMessage<unknown, never, InferUITools<ReturnType<typeof ownerTools>>>;

export async function POST(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;

  const { messages }: { messages: OwnerUIMessage[] } = await req.json();
  const tools = ownerTools();
  const result = streamText({
    model: chatModel,
    system: await ownerSystemPrompt(),
    messages: await convertToModelMessages(messages.slice(-24), { tools }),
    tools,
    stopWhen: isStepCount(8),
    maxRetries: 1,
    providerOptions: googleOptions,
  });
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream, tools, onError: friendlyAiError }),
  });
}
