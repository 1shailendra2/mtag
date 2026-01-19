"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, MoreVertical, Edit, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";

interface Contact {
    username: string;
    isOnline: boolean;
}

interface ChatSidebarProps {
    onSelectContact: (username: string) => void;
    selectedContact: string | null;
}

export function ChatSidebar({ onSelectContact, selectedContact }: ChatSidebarProps) {
    const { user, logout } = useAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const socket = getSocket();

        // Listen for online users updates
        socket.on('online_users', (users: string[]) => {
            setOnlineUsers(users);

            // Update contacts with online status
            const uniqueUsers = Array.from(new Set(users.filter(u => u !== user?.username)));
            const contactList: Contact[] = uniqueUsers.map(username => ({
                username,
                isOnline: true
            }));
            setContacts(contactList);
        });

        return () => {
            socket.off('online_users');
        };
    }, [user]);

    const filteredContacts = contacts.filter(contact =>
        contact.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full border-r bg-muted/30 w-full md:w-80 lg:w-96">
            {/* Sidebar Header */}
            <div className="p-4 border-b flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Messages
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">@{user?.username}</p>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-accent rounded-full transition-colors">
                        <Edit className="w-5 h-5" />
                    </button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={logout}
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-background/50 border-none ring-1 ring-muted focus-visible:ring-primary/50"
                    />
                </div>
            </div>

            {/* Contacts List */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {filteredContacts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            {searchQuery ? 'No users found' : 'No online users'}
                        </div>
                    ) : (
                        filteredContacts.map((contact) => (
                            <div
                                key={contact.username}
                                onClick={() => onSelectContact(contact.username)}
                                className={cn(
                                    "group flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-accent transition-all duration-200",
                                    selectedContact === contact.username ? "bg-accent/50" : ""
                                )}
                            >
                                <div className="relative">
                                    <Avatar className="w-12 h-12 ring-2 ring-background border-2 border-transparent group-hover:border-primary/20 transition-all">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.username}`} />
                                        <AvatarFallback>{contact.username[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    {contact.isOnline && (
                                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-sm truncate">{contact.username}</p>
                                    </div>
                                    <p className="text-xs text-green-500">Online</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
