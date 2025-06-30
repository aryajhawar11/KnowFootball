"use client"
import Image from "next/image"
import Know_Football_removebg_preview from "./assets/Know_Football_removebg_preview.png"
import { useChat } from "@ai-sdk/react"
import { Message } from "ai"
import Bubble from "./components/Bubble"
import LoadingBubble from "./components/LoadingBubble"
import PromptSuggestionRow from "./components/PromptSuggestionRow"
import { useRef, useEffect } from "react";


const Home = () => {
    const { append, isLoading, messages, input, handleInputChange, handleSubmit } = useChat()
    const messagesEndRef = useRef<HTMLDivElement>(null);


    const noMessages = !messages || messages.length === 0;

    useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
}, [messages]);


    const handlePrompt =( promptText )=>{
        const msg= {
            id: crypto.randomUUID(),
            content: promptText,
            role: "user"
        }
        append(msg as any)
    }

    return (
        <main>
            <Image src={Know_Football_removebg_preview} width="250" alt="KnowFootball Logo" />
            <section className={noMessages ? "" : "populated"}>
                {noMessages ? (
                    <>
                        <p> Dive into the world of football like never before.
                            KnowFootball combines cutting-edge AI with real-time data to bring you instant answers to all your football questions — from player stats and match histories to league standings and tournament insights.
                            Whether you&#39;re a passionate fan, a fantasy league strategist, or just curious, our intelligent assistant is here to keep you updated, informed, and ahead of the game.
                            Ask anything. Get smart answers. KnowFootball.</p>

                        <br />
                        <PromptSuggestionRow onPromptClick={handlePrompt} />
                    </>
                ) : (
                    <>
                        {messages.map((message, index)=><Bubble key={`message-${index}`} message={message} />)}
                        {isLoading && <LoadingBubble />}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </section>
            <form onSubmit={handleSubmit}>
                <input type="text" className="question-box" onChange={handleInputChange} value={input} placeholder="Ask me something....." />
                <input type="submit" />
            </form>
        </main>
    )
}

export default Home

// 
// 
