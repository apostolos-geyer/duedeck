import { randomUUID } from "node:crypto";
import { os } from "@orpc/server";
import { createPresignedUpload } from "@repo/storage";
import { type } from "arktype";

const presignedUpload = os
  .input(
    type({
      filename: "string",
      contentType: "string",
      "maxSize?": "number",
    }),
  )
  .handler(async ({ input }) => {
    const ext = input.filename.split(".").pop() ?? "bin";
    const key = `${randomUUID()}.${ext}`;

    const result = await createPresignedUpload({
      key,
      contentType: input.contentType,
      maxSize: input.maxSize,
    });

    return result;
  });

export const router = {
  uploads: {
    presign: presignedUpload,
  },
};
