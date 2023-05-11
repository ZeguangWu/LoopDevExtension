export type RuntimeMessageEndpoint = "devtools" | "content-script" | "popup";

export type RuntimeMessage = {
  /**
   * Source endpoint.
   */
  from: RuntimeMessageEndpoint;
  /**
   * Target endpoint.
   */
  to: RuntimeMessageEndpoint;
  /**
   * Message type.
   */
  type: string;
} & { [key: string]: any };
