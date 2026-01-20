"use client";

import { useState } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";

export function ChatLayout() {
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

    return (
        <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/20">
            <ChatSidebar
                onSelectRoom={setSelectedRoomId}
                selectedRoomId={selectedRoomId}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <ChatMessages selectedRoomId={selectedRoomId} />
                <ChatInput selectedRoomId={selectedRoomId} />
            </div>
        </div>
    );
}
