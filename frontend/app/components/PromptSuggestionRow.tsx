import React from 'react'
import PromptSuggestionButton from './PromptSuggestionButton'

const PromptSuggestionRow = ({onPromptClick}) => {

  const prompts= [
    "🔥 Top 5 football rivalries in world football.",
    "🏆 Unbreakable Football Records",
    "🧠 Give me trivia about famous World Cup upsets.",
    "🎯 Legendary Football Coaches",
  ]

  return (
    <div className='prompt-suggestion-row'>
      {prompts.map((prompt,index)=> <PromptSuggestionButton 
        key={`suggestion-${index}`}
        text={prompt}
        onClick={()=> onPromptClick(prompt)}/>)}
      
    </div>
  )
}

export default PromptSuggestionRow
