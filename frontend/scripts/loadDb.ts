import { DataAPIClient} from "@datastax/astra-db-ts"
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import OpenAI from "openai"

import {RecursiveCharacterTextSplitter} from "langchain/text_splitter"

import "dotenv/config"

type SimilarityMetric= "dot_product"|"cosine"|"euclidean" // to find similarity bw two vectors

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY
}= process.env

const openai= new OpenAI({apiKey: OPENAI_API_KEY})

const footballData = [
    'https://en.wikipedia.org/wiki/Association_football',
    'https://www.transfermarkt.com/',
    "https://www.fifa.com/tournaments",         // FIFA tournaments overview
  "https://www.fifa.com/fifaplus/en/news",    // FIFA news
  "https://www.uefa.com/uefachampionsleague/",// Champions League
  "https://www.uefa.com/euro2024/",           // EURO 2024
  "https://www.sofascore.com/football",       // Sofascore football section
  "https://www.sofascore.com/team/football",  // Sofascore team directory
  "https://www.goal.com/en/live-scores",      // Goal live scores
  "https://www.goal.com/en/news"   ,           // Goal news section
  // Premier League (England) – seasons
  "https://fbref.com/en/comps/9/history/Premier-League-Seasons", // full archive :contentReference[oaicite:1]{index=1}
  "https://fbref.com/en/comps/9/stats/",                         // season stats overview :contentReference[oaicite:2]{index=2}

  // La Liga (Spain)
  "https://fbref.com/en/comps/12/La-Liga-Seasons",             // seasons archive :contentReference[oaicite:3]{index=3}
  "https://fbref.com/en/comps/12/stats/La-Liga-Stats",         // season stats :contentReference[oaicite:4]{index=4}

  // Serie A (Italy) – FBref uses comp=11
  "https://fbref.com/en/comps/11/Serie-A-Seasons",             // (adjust comp ID as needed)

  // Bundesliga (Germany) – FBref uses comp=20
  "https://fbref.com/en/comps/20/Bundesliga-Seasons",          // (adjust comp ID as needed)

  // Ligue 1 (France)
  "https://www.soccer24.com/france/ligue-1/archive/",          // results archive :contentReference[oaicite:5]{index=5}
  "https://www.livesport.com/uk/football/france/ligue-1/archive/", // backup :contentReference[oaicite:6]{index=6}

]

const client= new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db= client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE })
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize:512, // Chunks divison of data into 512 characters
    chunkOverlap: 100 // this is for keeping context from the last chunk so that the results are better and are not irrelevant
})

const createCollection = async (similarityMetric: SimilarityMetric= "dot_product")=>{
    const res = await db.createCollection(ASTRA_DB_COLLECTION,{
        vector:{
            dimension: 1536,
            metric: similarityMetric
        }
    })
    console.log(res)
}

const loadSampleData= async ()=>{
    const collection= await db.collection(ASTRA_DB_COLLECTION)
    for await( const url of footballData){
        const content = await scrapePage(url)
        const chunks = await splitter.splitText(content)
        for await(const chunk of chunks){
            const embedding= await openai.embeddings.create({
            model:"text-embedding-3-small",
            input: chunk,
            encoding_format: "float"

        })
        const vector = embedding.data[0].embedding

        const res= await collection.insertOne({
            $vector: vector,
            text: chunk
        })
        console.log(res)
        }
    }
}
    const scrapePage = async(url: string)=>{
        const loader = new PuppeteerWebBaseLoader(url, {
            launchOptions: {
                headless: true
            },
            gotoOptions:{
                waitUntil: "domcontentloaded"
            },
            evaluate: async (page,browser)=>{
                const result= await page.evaluate(()=> document.body.innerHTML)
                await browser.close()
                return result
            }
        })
        return (await loader.scrape())?.replace(/<[^>]*>?/gm, '') // replacing html tags with ''
    }


    createCollection().then(()=>loadSampleData())