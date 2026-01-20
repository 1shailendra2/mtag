"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Phone, Video, Info, Hash } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { getSocket } from "@/lib/socket";
import api from "@/lib/api";

interface Message {
    _id?: string;
    sender: string;
    roomId: string; // Changed from recipient to roomId
    content: string;
    timestamp: Date;
}

interface ChatMessagesProps {
    selectedRoomId: string | null;
}

export function ChatMessages({ selectedRoomId }: ChatMessagesProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch message history when room is selected
    useEffect(() => {
        if (!selectedRoomId || !user) return;

        const fetchMessages = async () => {
            try {
                const response = await api.get(`/messages/${selectedRoomId}`);
                setMessages(response.data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        fetchMessages();

        // Join room in Socket.io
        const socket = getSocket();
        socket.emit('join_room', selectedRoomId);

        return () => {
            socket.emit('leave_room', selectedRoomId);
        };
    }, [selectedRoomId, user]);

    // Listen for incoming messages via Socket.io
    useEffect(() => {
        const socket = getSocket();

        const handleReceiveMessage = (data: { sender: string; roomId: string; content: string; timestamp: Date }) => {
            if (data.roomId === selectedRoomId) {
                setMessages(prev => [...prev, {
                    sender: data.sender,
                    roomId: data.roomId,
                    content: data.content,
                    timestamp: data.timestamp
                }]);
            }
        };

        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [selectedRoomId, user]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    if (!selectedRoomId) {
        return (
            <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm items-center justify-center">
                <div className="text-center max-w-md px-4">
                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Hash className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Select a Room</h3>
                    <p className="text-muted-foreground">
                        Join a room from the sidebar to start chatting with others
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
            {/* Messaging Header */}
            <div className="p-4 border-b flex items-center justify-between bg-background/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <Hash className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="font-bold text-sm leading-none">{selectedRoomId}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Public Room</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                        <Info className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                <div className="space-y-6 max-w-4xl mx-auto">
                    {messages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No messages in this room yet. Be the first to say hi!
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.sender === user?.username;
                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        "flex items-end gap-3",
                                        isMe ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <div className={cn(
                                        "flex flex-col max-w-[80%] md:max-w-[70%]",
                                        isMe ? "items-end" : "items-start"
                                    )}>
                                        {!isMe && <span className="text-[10px] text-muted-foreground mb-1 ml-1">{msg.sender}</span>}
                                        <div
                                            className={cn(
                                                "px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all duration-300",
                                                isMe
                                                    ? "bg-primary text-primary-foreground rounded-br-none hover:shadow-primary/20"
                                                    : "bg-muted text-foreground rounded-bl-none hover:bg-muted/80"
                                            )}
                                        >
                                            {msg.content}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mt-1.5 px-1 uppercase tracking-tighter">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
