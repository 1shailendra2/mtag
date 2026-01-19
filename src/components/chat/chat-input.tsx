"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Smile, Send, Mic, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { getSocket } from "@/lib/socket";

interface ChatInputProps {
    selectedContact: string | null;
}

export function ChatInput({ selectedContact }: ChatInputProps) {
    const [message, setMessage] = useState("");

    const handleSend = () => {
        if (!message.trim() || !selectedContact) return;

        const socket = getSocket();
        socket.emit('send_message', {
            recipient: selectedContact,
            content: message.trim()
        });

        setMessage("");
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-4 bg-background/80 backdrop-blur-md border-t">
            <div className="max-w-4xl mx-auto flex items-center gap-2 md:gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full shrink-0 hover:bg-primary/10 hover:text-primary transition-colors"
                    disabled={!selectedContact}
                >
                    <Plus className="w-5 h-5" />
                </Button>

                <div className="flex-1 relative group">
                    <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={selectedContact ? "Type a message..." : "Select a contact first..."}
                        disabled={!selectedContact}
                        className="w-full bg-muted/50 border-none rounded-2xl pl-12 pr-12 focus-visible:ring-primary/40 focus-visible:bg-muted/80 transition-all py-6 h-auto"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full hover:bg-transparent text-muted-foreground hover:text-primary transition-colors"
                        disabled={!selectedContact}
                    >
                        <ImageIcon className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full hover:bg-transparent text-muted-foreground hover:text-primary transition-colors"
                        disabled={!selectedContact}
                    >
                        <Smile className="w-5 h-5" />
                    </Button>
                </div>

                <Button
                    size="icon"
                    className={message.length > 0 ? "rounded-full bg-primary hover:bg-primary/90 transition-all scale-100" : "rounded-full bg-muted text-muted-foreground transition-all"}
                    disabled={message.length === 0 || !selectedContact}
                    onClick={handleSend}
                >
                    {message.length > 0 ? <Send className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
            </div>
        </div>
    );
}
