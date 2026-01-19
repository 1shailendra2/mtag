"use client";

import { useState } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";

export function ChatLayout() {
    const [selectedContact, setSelectedContact] = useState<string | null>(null);

    return (
        <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/20">
            <ChatSidebar
                onSelectContact={setSelectedContact}
                selectedContact={selectedContact}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <ChatMessages selectedContact={selectedContact} />
                <ChatInput selectedContact={selectedContact} />
            </div>
        </div>
    );
}
