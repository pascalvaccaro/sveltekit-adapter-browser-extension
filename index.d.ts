import { Adapter } from "@sveltejs/kit";

type WebExtAdapterOptions = {
  pages?: string;
  assets?: string;
  fallback?: string;
  manifest?: Record<string, unknown>
}
export default function (opts: WebExtAdapterOptions): Adapter;