// Open the "Ask Aai" assistant from anywhere (header button, banner ask bar, mobile bar).
export const OPEN_ASSISTANT_EVENT = "bf:open-assistant";
export type OpenAssistantDetail = { text?: string };

export function openAssistant(text?: string) {
  window.dispatchEvent(new CustomEvent<OpenAssistantDetail>(OPEN_ASSISTANT_EVENT, { detail: { text } }));
}
