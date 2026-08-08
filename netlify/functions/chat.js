exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { messages: chatHistory, cards: userCards } = JSON.parse(event.body);
    if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Messages array is required" }) };
    }

    // Default Cards (Guaranteed to be present)
    const defaultCards = [
      "Chase Freedom Unlimited", "Chase Freedom Flex", "Chase Sapphire Preferred",
      "Chase Amazon Prime Visa", "Discover IT Card", "Apple Card",
      "Bank of America Unlimited Rewards", "Bank of America Travel Rewards",
      "Bilt Blue Card", "Amex Gold", "Amex Blue Cash Everyday"
    ];

    const cards = (userCards && Array.isArray(userCards) && userCards.length > 0) ? userCards : defaultCards;

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
       console.error("Missing NVIDIA_API_KEY environment variable.");
       return {
         statusCode: 500,
         body: JSON.stringify({ error: "Server Configuration Error: Missing API Key" })
       };
    }

    const cardData = {
      "Chase Freedom Unlimited": "1.5% everywhere, 3% dining/drugstores, 5% travel via Chase",
      "Chase Freedom Flex": "5% rotating categories, 3% dining/drugstores, 5% travel via Chase",
      "Chase Sapphire Preferred": "3x dining/online groceries/streaming, 2x travel, 5x travel via Chase portal",
      "Chase Amazon Prime Visa": "5% Amazon/Whole Foods, 2% gas/restaurants/transit",
      "Discover IT Card": "5% rotating quarterly categories",
      "Apple Card": "3% Apple/Uber/UberEats/Walgreens/Nike/Panera/Exxon (with Apple Pay), 2% all Apple Pay, 1% physical card",
      "Bank of America Unlimited Rewards": "1.5% everywhere",
      "Bank of America Travel Rewards": "1.5x points everywhere",
      "Bilt Blue Card": "1x Rent, 2x Travel, 3x Dining",
      "Amex Gold": "4x Restaurants, 4x US Supermarkets, 3x Flights",
      "Amex Blue Cash Everyday": "3% US Supermarkets, 3% US Online Retail, 3% US Gas Stations"
    };

    const userCardDetails = cards.map(c => {
      const details = cardData[c] ? ` (${cardData[c]})` : "";
      return `- ${c}${details}`;
    }).join("\n");

    // 3. Construct the Prompt
    const systemPrompt = `You are a highly knowledgeable credit card rewards expert. 
The user has the following credit cards in their portfolio:
${userCardDetails}

Your goal is to help them maximize their rewards. Answer their questions accurately based on the standard benefits, reward categories, and perks of these specific cards. 

CRITICAL INSTRUCTIONS:
1. Keep your answers extremely concise, clear, and formatted in markdown. Do not write long paragraphs.
2. Focus ONLY on the cards they own unless they explicitly ask about a new card.
3. PAY EXTREMELY CLOSE ATTENTION to the exact names of the cards. DO NOT confuse "Chase Freedom Unlimited" with "Chase Freedom Flex". They are different cards with different rewards.
4. RELY HEAVILY on the specific multipliers provided in the list above (e.g. Apple Card 3% on Uber).`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...chatHistory
    ];

    // 4. Call NVIDIA API
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: apiMessages,
        max_tokens: 500,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("NVIDIA API Error:", errText);
      throw new Error(`AI API responded with ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };

  } catch (error) {
    console.error("Chat Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};
