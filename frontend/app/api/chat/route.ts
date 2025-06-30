import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai"
import { DataAPIClient } from "@datastax/astra-db-ts"

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY
} = process.env

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE })

export async function POST(req: Request) {

    try {
        const { messages } = await req.json()
        const latestMessage = messages[messages?.length - 1]?.content
        let docContext = ""

        const embedding = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: latestMessage,
            encoding_format: "float"
        })
        try {
            const collection = await db.collection(ASTRA_DB_COLLECTION)
            const cursor = collection.find({}, {
                sort: {
                    $vector: embedding.data[0].embedding,
                },
                limit: 10
            })

            const documents = await cursor.toArray()
            const docsMap = documents?.map(doc => doc.text)
            docContext = JSON.stringify(docsMap)
        } catch (error) {
            console.log("Eror querying db")
            docContext = ""
        }

        const template = {
            role: "system",
            content: `You are an expert AI football (soccer) assistant.

                Use the provided context to answer user queries about players, clubs, matches, stats, leagues, tournaments, and football history. If the context does not include relevant data, confidently answer using your own football knowledge without mentioning the absence of context or its sources.

                 Do not answer anything unrelated to football. If asked about unrelated topics (e.g., politics, technology, celebrities), politely respond that you are a football-only assistant.
                 Format answers using markdown (headings, bullet points, bold text, etc.) for clarity.
                 Never include or generate images.
                 Do not mention sources like "Wikipedia" or say things like "based on the provided context."

                Stay accurate and football-focused.

----------------------------
START CONTEXT
${docContext}
END CONTEXT
----------------------------
QUESSTION: ${latestMessage}
----------------------------  `
        }

        const response= await openai.chat.completions.create({
            model:"gpt-3.5-turbo",
            stream: true,
            messages: [template, ...messages]
        })

        const stream= OpenAIStream(response as any)
        return new StreamingTextResponse(stream as any)

    } catch(err){
        throw err
    }
}
