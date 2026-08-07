const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  const adminPasscode = process.env.ADMIN_PASSCODE || 'password123';
  const providedPasscode = event.headers.authorization;

  if (providedPasscode !== adminPasscode) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized. Incorrect passcode." })
    };
  }

  try {
    // Initialize Blob store
    const store = getStore("cards-store");
    
    // Fallback default cards
    const defaultCards = [
      "Chase Freedom Unlimited",
      "Chase Freedom Flex",
      "Chase Sapphire Preferred",
      "Chase Amazon Prime Visa",
      "Discover IT Card",
      "Apple Card",
      "Bank of America Unlimited Rewards",
      "Bank of America Travel Rewards",
      "Bilt Blue Card",
      "Amex Gold",
      "Amex Blue Cash Everyday"
    ];

    if (event.httpMethod === "GET") {
      let cards = await store.get("portfolio", { type: "json" });
      if (!cards) {
        cards = defaultCards;
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ cards })
      };
    } 
    
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body);
      if (data.cards && Array.isArray(data.cards)) {
        await store.setJSON("portfolio", data.cards);
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true })
        };
      }
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid data format" })
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };

  } catch (error) {
    console.error("Cards Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};
