"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, Plus, LogOut, Hash } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Room {
    _id: string;
    name: string;
    createdBy: string;
}

interface ChatSidebarProps {
    onSelectRoom: (roomId: string) => void;
    selectedRoomId: string | null;
}

export function ChatSidebar({ onSelectRoom, selectedRoomId }: ChatSidebarProps) {
    const { user, logout } = useAuth();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [newRoomName, setNewRoomName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const fetchRooms = async () => {
        try {
            const response = await api.get('/rooms');
            setRooms(response.data);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoomName.trim()) return;

        try {
            await api.post('/rooms', { name: newRoomName.trim() });
            setNewRoomName("");
            setIsCreating(false);
            fetchRooms();
        } catch (error) {
            alert("Failed to create room. Name might already exist.");
        }
    };

    const filteredRooms = rooms.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full border-r bg-muted/30 w-full md:w-80 lg:w-96">
            {/* Sidebar Header */}
            <div className="p-4 border-b flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Chat Rooms
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">@{user?.username}</p>
                </div>
                <div className="flex gap-2">
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

            {/* Create Room */}
            <div className="p-4 border-b">
                {isCreating ? (
                    <form onSubmit={handleCreateRoom} className="flex gap-2">
                        <Input
                            placeholder="Room name..."
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            className="h-9"
                            autoFocus
                        />
                        <Button type="submit" size="sm">Create</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(false)}>Cancel</Button>
                    </form>
                ) : (
                    <Button
                        className="w-full justify-start gap-2"
                        variant="outline"
                        onClick={() => setIsCreating(true)}
                    >
                        <Plus className="w-4 h-4" />
                        New Room
                    </Button>
                )}
            </div>

            {/* Search */}
            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search rooms..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-background/50 border-none ring-1 ring-muted focus-visible:ring-primary/50"
                    />
                </div>
            </div>

            {/* Rooms List */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {filteredRooms.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            {searchQuery ? 'No rooms found' : 'No rooms created yet'}
                        </div>
                    ) : (
                        filteredRooms.map((room) => (
                            <div
                                key={room._id}
                                onClick={() => onSelectRoom(room.name)} // Using room name as roomId for simplicity in this implementation
                                className={cn(
                                    "group flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-accent transition-all duration-200",
                                    selectedRoomId === room.name ? "bg-accent/50" : ""
                                )}
                            >
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                    <Hash className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{room.name}</p>
                                    <p className="text-[10px] text-muted-foreground">Created by {room.createdBy}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
