exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { message, cards: userCards } = JSON.parse(event.body);
    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: "Message is required" }) };
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

    const adminPasscode = process.env.ADMIN_PASSCODE || 'password123';
    const providedPasscode = event.headers.authorization;

    if (providedPasscode !== adminPasscode) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized. Incorrect passcode." })
      };
    }

    // 3. Construct the Prompt
    const systemPrompt = `You are a highly knowledgeable credit card rewards expert. 
The user has the following credit cards in their portfolio:
${cards.map(c => `- ${c}`).join("\n")}

Your goal is to help them maximize their rewards. Answer their questions accurately based on the standard benefits, reward categories, and perks of these specific cards. Keep your answers concise, clear, and formatted in markdown. Focus ONLY on the cards they own unless they explicitly ask about a new card.`;

    // 4. Call NVIDIA API
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.3-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 1024,
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
