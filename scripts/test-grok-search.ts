import { prisma } from '@/lib/db/prisma'
import { getTrendingMarkets } from '@/lib/services/market-service'
import { getMarketById } from '@/lib/services/market-service'

async function testGrokSearch() {
  try {
    // Using a sample trending market for testing the user message format
    console.log('🔍 Using sample trending market for testing...')
    
    // Sample market data (typical high-volume Polymarket prediction)
    const market = {
      question: "Will Donald Trump win the 2024 US Presidential Election?",
      volume: 89500000,
      endDate: new Date('2024-11-05'),
      description: "This market will resolve to \"Yes\" if Donald Trump wins the 2024 US Presidential Election, and \"No\" otherwise.",
      resolutionSource: "Associated Press election results"
    }
    
    const trendingEvent = {
      title: "2024 US Presidential Election",
      category: "ELECTIONS", 
      description: "The 2024 United States presidential election, scheduled for November 5, 2024, will be the 60th quadrennial presidential election."
    }

    console.log(`\n📊 Selected Market: ${market.question}`)
    console.log(`📈 Volume: $${market.volume.toLocaleString()}`)
    console.log(`📅 End Date: ${market.endDate.toISOString().split('T')[0]}`)
    console.log(`🏷️ Event: ${trendingEvent.title}`)
    if (market.description) {
      console.log(`📝 Description: ${market.description}`)
    }
    if (market.resolutionSource) {
      console.log(`🔗 Resolution Source: ${market.resolutionSource}`)
    }

    // Construct user message for Grok research
    const systemMessage = `You are a research assistant specialized in X (Twitter) analysis. Your task is to search X (Twitter) for the most relevant and up-to-date information, discussions, sentiment, and trends related to the given prediction market to help AI models make accurate predictions.

Focus on:
- Recent tweets and discussions about the topic
- Sentiment analysis from influential accounts
- Breaking news or developments
- Key opinion leaders' perspectives
- Viral content or trending hashtags related to the topic

Format your response as a JSON object with the following structure:
{
  "relevant_information": "A comprehensive summary of X (Twitter) sentiment, key discussions, and recent developments you found.",
  "links": ["list", "of", "relevant", "Twitter/X", "URLs"],
  "sentiment_analysis": "Overall sentiment (positive/negative/neutral) with key insights",
  "key_accounts": ["list", "of", "influential", "accounts", "discussing", "this", "topic"]
}

IMPORTANT: You *must* search X (Twitter) and the 'links' array cannot be empty. Return ONLY a valid JSON object. Do NOT wrap your response in markdown code blocks, backticks, or any other formatting. Return pure JSON.`

    const userMessage = `Please search X (Twitter) for the latest information, sentiment, and discussions regarding the following prediction market:

Market: "${market.question}"
${market.description ? `Market Description: ${market.description}` : ''}
${market.endDate ? `Market End Date: ${market.endDate.toISOString().split('T')[0]}` : ''}
${market.resolutionSource ? `Resolution Source: ${market.resolutionSource}` : ''}
${trendingEvent.description ? `Event Context: ${trendingEvent.description}` : ''}

Event: "${trendingEvent.title}"
Category: ${trendingEvent.category}

Focus on recent X (Twitter) activity, sentiment from key accounts, breaking news, viral content, and trending discussions that could influence the outcome of this prediction market. Pay special attention to:
- Official accounts related to the topic
- News outlets reporting on X
- Expert commentary and analysis
- Public sentiment and reaction
- Any recent developments or announcements

Analyze the overall Twitter/X sentiment and provide insights that would help AI models understand the current social media landscape around this prediction.`

    console.log('\n=== SYSTEM MESSAGE ===')
    console.log(systemMessage)
    
    console.log('\n=== USER MESSAGE ===')
    console.log(userMessage)

    // TODO: Implement actual Grok API call here
    console.log('\n💡 Next steps:')
    console.log('1. Set up Grok API credentials')
    console.log('2. Implement OpenRouter call with grok model')
    console.log('3. Enable X search functionality')
    console.log('4. Test and validate response format')

  } catch (error) {
    console.error('Error in testGrokSearch:', error)
  }
}

if (require.main === module) {
  testGrokSearch()
}

export { testGrokSearch }