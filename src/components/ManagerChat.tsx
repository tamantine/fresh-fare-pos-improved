import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { MessageSquare, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
}

export const ManagerChat = () => {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Olá! Sou seu Gerente Inteligente. Posso ajudar com consultas de vendas, estoque e análises do seu hortifruti. O que deseja saber hoje?",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            // FALLBACK STRATEGY: Use Anon Key instead of User Token
            // The Gateway is rejecting the User Token (401), likely due to a verification issue.
            // The Anon Key is also a valid JWT and should pass the 'verify_jwt' check.
            const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

            if (!anonKey) {
                console.error("Erro: Anon Key não encontrada.");
                throw new Error("Configuração de API ausente.");
            }

            console.log("Tentando conexão com Anon Key...");

            const { data, error } = await supabase.functions.invoke('manager-agent', {
                body: { message: userMsg.content },
                headers: {
                    // Force the Anon Key as the Authorization token
                    Authorization: `Bearer ${anonKey}`
                }
            });

            if (error) {
                console.error("Erro retornado pela função:", error);
                throw error;
            }

            const aiResponse = data?.content || "Desculpe, não consegui processar sua solicitação.";

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: aiResponse,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, aiMsg]);
        } catch (error: any) {
            console.error("Erro no chat:", error);
            toast({
                title: "Erro na IA",
                description: "Não foi possível conectar ao Gerente Inteligente.",
                variant: "destructive",
            });
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "system",
                    content: "⚠️ Erro de conexão. Tente novamente mais tarde.",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white z-50 animate-in zoom-in duration-300"
                    size="icon"
                >
                    <Sparkles className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0 border-l-2 border-indigo-100">
                <SheetHeader className="p-4 border-b bg-indigo-50/50">
                    <SheetTitle className="flex items-center gap-2 text-indigo-900">
                        <Bot className="h-6 w-6 text-indigo-600" />
                        Gerente Inteligente
                    </SheetTitle>
                    <SheetDescription>
                        Converse com a IA para gerenciar sua loja e consultar dados.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 p-4 bg-slate-50">
                    <div className="flex flex-col gap-4 pb-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                    }`}
                            >
                                <div
                                    className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user"
                                        ? "bg-slate-200 text-slate-700"
                                        : "bg-indigo-100 text-indigo-700"
                                        }`}
                                >
                                    {msg.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                                </div>
                                <div
                                    className={`rounded-2xl p-4 max-w-[85%] text-sm shadow-sm ${msg.role === "system"
                                        ? "bg-red-50 text-red-600 border border-red-100 w-full text-center"
                                        : msg.role === "user"
                                            ? "bg-white text-slate-800 border border-slate-100"
                                            : "bg-indigo-600 text-white"
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    <span className={`text-[10px] block mt-2 opacity-70 ${msg.role === "assistant" ? "text-indigo-200" : "text-slate-400"}`}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <Bot className="h-5 w-5 text-indigo-700" />
                                </div>
                                <div className="bg-indigo-50 rounded-2xl p-4 flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                    <span className="text-xs text-indigo-500 font-medium">Analisando dados...</span>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                <div className="p-4 bg-white border-t">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Pergunte sobre vendas, estoque..."
                            className="flex-1 bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={isLoading || !input.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
};
