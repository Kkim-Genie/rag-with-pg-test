"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useState } from "react";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    maxSteps: 3,
  });

  // Function to process content and convert <link></link> tags to clickable links
  const processContent = (content: string) => {
    if (!content) return "";

    // Create a temporary container
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;

    // Find all link tags
    const linkRegex = /<link>(.*?)<\/link>/g;
    let result = content;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const fullMatch = match[0]; // The entire <link>url</link>
      const url = match[1]; // Just the url part

      // Replace the <link>url</link> with an actual anchor tag
      result = result.replace(
        fullMatch,
        `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">${url}</a>`
      );
    }

    return result;
  };

  console.log(messages);

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      <div className="space-y-4">
        {messages.map((m) => (
          <div key={m.id} className="whitespace-pre-wrap">
            <div>
              <div className="font-bold">{m.role}</div>
              <p>
                {m.content.length > 0 ? (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: processContent(m.content),
                    }}
                  />
                ) : (
                  <span className="italic font-light">
                    {"calling tool: " + m?.toolInvocations?.[0].toolName}
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
