// utils/tools-utils.js
import { formatDataStreamPart } from '@ai-sdk/ui-utils';
import { convertToCoreMessages } from 'ai';
// Approval string to be shared across frontend and backend
export const APPROVAL = {
  YES: 'Yes, confirmed.',
  NO: 'No, denied.'
};
function isValidToolName(key, obj) {
  return key in obj;
}
// Make sure you import or define isValidToolName as needed
export async function processToolCalls({ tools, dataStream, messages, userId }) {
  // Log the userId as soon as this function is called.
  console.log('processToolCalls: received userId =', userId);
  const lastMessage = messages[messages.length - 1];
  const parts = lastMessage.parts;
  if (!parts) return messages;
  const processedParts = await Promise.all(
    parts.map(async part => {
      // Only process parts that represent tool invocations.
      if (part.type !== 'tool-invocation') return part;
      const { toolInvocation } = part;
      const toolName = toolInvocation.toolName;
      // Only continue if we have an execute function for the tool and it's in a 'result' state.
      if (typeof tools[toolName]?.execute !== 'function' || toolInvocation.state !== 'result') {
        return part;
      }
      let result;
      if (toolInvocation.result === APPROVAL.YES) {
        // Verify that the tool exists and is callable.
        const toolInstance = tools[toolName];
        if (toolInstance) {
          // Build the context object for tool execution.
          const context = {
            userId, // This should carry the valid userId
            messages: convertToCoreMessages(messages),
            toolCallId: toolInvocation.toolCallId
          };
          console.log(`Invoking tool "${toolName}" with args:`, toolInvocation.args, 'and context:', context);
          result = await toolInstance(toolInvocation.args, context);
        } else {
          result = 'Error: No execute function found on tool';
        }
      } else if (toolInvocation.result === APPROVAL.NO) {
        result = 'Error: User denied access to tool execution';
      } else {
        // For any unhandled responses, return the original part.
        return part;
      }
      // Forward updated tool result to the client.
      dataStream.write(
        formatDataStreamPart('tool_result', {
          toolCallId: toolInvocation.toolCallId,
          result
        })
      );
      // Return an updated version of the tool invocation part.
      return {
        ...part,
        toolInvocation: {
          ...toolInvocation,
          result
        }
      };
    })
  );
  // Finally return the processed messages with the updated last message.
  return [...messages.slice(0, -1), { ...lastMessage, parts: processedParts }];
}
/**
* Returns an array of tool names that require human
confirmation.
*
* A tool is assumed to require confirmation if it does not
have an `execute` function,
* meaning it only exists on the client (i.e. the server
version of the tool would provide
* an execute function).
*
* @param {Object} tools - Map of tool names to Tool
instances.
* @returns {Array} List of tool names that require
confirmation.
*/
export function getToolsRequiringConfirmation(tools) {
  return Object.keys(tools).filter(key => {
    const maybeTool = tools[key];
    return typeof maybeTool.execute !== 'function';
  });
}
